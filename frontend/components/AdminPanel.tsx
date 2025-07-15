'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
} from 'wagmi/actions'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
  KinoshiButton,
  Slider,
  Input,
} from '@/components/ui'
import { toast } from 'sonner'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import type { Abi } from 'viem'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

interface TokenAllocation {
  tokenAddress: string
  symbol: string
  decimals: number
  weight: number // en pourcentage (0-100)
  active: boolean
}

const AdminPanel: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { registeredTokens, fetchTokenData } = useTokenRegistry()
  const [allocations, setAllocations] = useState<TokenAllocation[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // États pour les frais
  const [exitFeeBps, setExitFeeBps] = useState<number>(0)
  const [isLoadingFees, setIsLoadingFees] = useState(false)
  const [isSavingFees, setIsSavingFees] = useState(false)
  const [isApplyingManagementFee, setIsApplyingManagementFee] = useState(false)

  // Initialiser les allocations avec les tokens enregistrés
  useEffect(() => {
    if (registeredTokens.length > 0) {
      const initialAllocations: TokenAllocation[] = registeredTokens.map(
        (token, index) => ({
          tokenAddress: token.tokenAddress,
          symbol: token.symbol,
          decimals: token.decimals,
          weight: Math.round(100 / registeredTokens.length), // Répartition équitable
          active: true,
        })
      )
      setAllocations(initialAllocations)
    }
  }, [registeredTokens])

  // Calculer le total des pondérations
  const totalWeight = allocations.reduce((sum, allocation) => {
    return sum + (allocation.active ? allocation.weight : 0)
  }, 0)

  // Vérifier si le total est égal à 100%
  const isTotalValid = Math.abs(totalWeight - 100) < 0.01

  // Mettre à jour une allocation
  const updateAllocation = (
    index: number,
    field: keyof TokenAllocation,
    value: string | number | boolean
  ) => {
    const newAllocations = [...allocations]
    newAllocations[index] = { ...newAllocations[index], [field]: value }
    setAllocations(newAllocations)
  }

  // Ajuster automatiquement les pondérations pour atteindre 100%
  const autoAdjustWeights = () => {
    const activeAllocations = allocations.filter((a) => a.active)
    if (activeAllocations.length === 0) return

    const equalWeight = Math.round(100 / activeAllocations.length)
    const remainder = 100 - equalWeight * activeAllocations.length

    const newAllocations = allocations.map((allocation) => {
      if (!allocation.active) return allocation

      const activeIndex = activeAllocations.findIndex(
        (a) => a.tokenAddress === allocation.tokenAddress
      )
      let weight = equalWeight
      if (activeIndex < remainder) weight += 1

      return { ...allocation, weight }
    })

    setAllocations(newAllocations)
  }

  // Sauvegarder les allocations
  const saveAllocations = async () => {
    if (!isConnected || !address) {
      toast.error('Wallet non connecté')
      return
    }

    if (!isTotalValid) {
      toast.error('La somme des pondérations doit être égale à 100%')
      return
    }

    setIsSaving(true)
    try {
      // Convertir les pourcentages en format uint256 base 1e18
      const assetAllocations = allocations
        .filter((allocation) => allocation.active)
        .map((allocation) => ({
          token: allocation.tokenAddress as `0x${string}`,
          weight: parseUnits(allocation.weight.toString(), 16), // 1e18 * (weight / 100)
          active: allocation.active,
        }))

      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'setAllocations',
        args: [assetAllocations],
      })

      await waitForTransactionReceipt(wagmiConfig, { hash })

      toast.success('Allocations mises à jour avec succès !')
      await fetchTokenData() // Rafraîchir les données
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde des allocations')
    } finally {
      setIsSaving(false)
    }
  }

  // Charger les frais actuels
  const loadFees = async () => {
    setIsLoadingFees(true)
    try {
      const exitFee = await readContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'exitFeeBps',
      })

      setExitFeeBps(Number(exitFee))
    } catch (error) {
      console.error('Erreur lors du chargement des frais:', error)
      // Garder les valeurs par défaut
    } finally {
      setIsLoadingFees(false)
    }
  }

  // Sauvegarder les frais de sortie
  const saveExitFee = async () => {
    if (!isConnected || !address) {
      toast.error('Wallet non connecté')
      return
    }

    if (exitFeeBps < 0 || exitFeeBps > 1000) {
      toast.error(
        'Les frais de sortie doivent être entre 0 et 1000 basis points'
      )
      return
    }

    setIsSavingFees(true)
    try {
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'setExitFeeBps',
        args: [BigInt(exitFeeBps)],
      })

      await waitForTransactionReceipt(wagmiConfig, { hash })
      toast.success('Frais de sortie mis à jour avec succès !')
      await loadFees() // Recharger les valeurs
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des frais de sortie:', error)
      toast.error('Erreur lors de la sauvegarde des frais de sortie')
    } finally {
      setIsSavingFees(false)
    }
  }

  // Appliquer les frais de gestion
  const applyManagementFee = async () => {
    if (!isConnected || !address) {
      toast.error('Wallet non connecté')
      return
    }

    setIsApplyingManagementFee(true)
    try {
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'accrueManagementFee',
      })

      await waitForTransactionReceipt(wagmiConfig, { hash })
      toast.success('Frais de gestion appliqués avec succès !')
    } catch (error) {
      console.error("Erreur lors de l'application des frais de gestion:", error)
      toast.error("Erreur lors de l'application des frais de gestion")
    } finally {
      setIsApplyingManagementFee(false)
    }
  }

  // Charger les données au montage
  useEffect(() => {
    if (isConnected) {
      fetchTokenData()
      loadFees()
    }
  }, [isConnected, fetchTokenData])

  if (!isConnected) {
    return (
      <KinoshiCard variant="outlined" className="max-w-4xl mx-auto">
        <KinoshiCardHeader>
          <KinoshiCardTitle>Panel d'administration</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent>
          <p className="text-[var(--kinoshi-text)]/70 font-sans font-medium">
            Veuillez vous connecter pour accéder au panel d'administration.
          </p>
        </KinoshiCardContent>
      </KinoshiCard>
    )
  }

  return (
    <div className="space-y-6">
      <KinoshiCard variant="outlined" className="max-w-4xl mx-auto">
        <KinoshiCardHeader>
          <KinoshiCardTitle>
            Modification des pondérations - Stratégie Équilibrée
          </KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent className="space-y-6">
          {allocations.length === 0 ? (
            <div className="text-center">
              <p className="text-[var(--kinoshi-text)]/70 font-sans font-medium">
                Aucun token enregistré trouvé.
              </p>
            </div>
          ) : (
            <>
              {/* Affichage du total */}
              <div className="flex justify-between items-center p-4 bg-[var(--kinoshi-primary)]/5 rounded-lg border">
                <span className="font-sans font-medium text-[var(--kinoshi-text)]">
                  Total des pondérations :
                </span>
                <span
                  className={`font-mono font-bold text-lg ${
                    isTotalValid ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {totalWeight.toFixed(2)}%
                </span>
              </div>

              {/* Message d'avertissement si le total n'est pas 100% */}
              {!isTotalValid && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-sans font-medium">
                    ⚠️ La somme des pondérations doit être exactement égale à
                    100%. Actuellement : {totalWeight.toFixed(2)}%
                  </p>
                </div>
              )}

              {/* Liste des tokens avec sliders */}
              <div className="space-y-4">
                {allocations.map((allocation, idx) => (
                  <div
                    key={allocation.tokenAddress}
                    className="p-4 border border-[var(--kinoshi-border)] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allocation.active}
                          onChange={(e) =>
                            updateAllocation(idx, 'active', e.target.checked)
                          }
                          className="w-4 h-4 text-[var(--kinoshi-primary)]"
                        />
                        <span className="font-sans font-semibold text-[var(--kinoshi-text)]">
                          {allocation.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={allocation.weight}
                          onChange={(e) =>
                            updateAllocation(
                              idx,
                              'weight',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-20 text-center"
                          disabled={!allocation.active}
                        />
                        <span className="text-sm text-[var(--kinoshi-text)]/70">
                          %
                        </span>
                      </div>
                    </div>

                    {allocation.active && (
                      <Slider
                        value={[allocation.weight]}
                        onValueChange={([value]: number[]) =>
                          updateAllocation(idx, 'weight', value)
                        }
                        max={100}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 justify-center pt-4 border-t border-[var(--kinoshi-border)]/30">
                <KinoshiButton
                  variant="outline"
                  onClick={autoAdjustWeights}
                  disabled={isSaving}
                >
                  Répartition équitable
                </KinoshiButton>
                <KinoshiButton
                  onClick={saveAllocations}
                  disabled={!isTotalValid || isSaving}
                >
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder les allocations'}
                </KinoshiButton>
              </div>
            </>
          )}
        </KinoshiCardContent>
      </KinoshiCard>

      {/* Section des frais */}
      <KinoshiCard variant="outlined" className="max-w-4xl mx-auto">
        <KinoshiCardHeader>
          <KinoshiCardTitle>Gestion des frais</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent className="space-y-6">
          {isLoadingFees ? (
            <div className="text-center">
              <p className="text-[var(--kinoshi-text)]/70 font-sans font-medium">
                Chargement des frais...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Frais de sortie */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-sans font-semibold text-[var(--kinoshi-text)]">
                    Frais de sortie
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={exitFeeBps}
                      onChange={(e) =>
                        setExitFeeBps(parseInt(e.target.value) || 0)
                      }
                      min="0"
                      max="1000"
                      step="1"
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-[var(--kinoshi-text)]/70">
                      bps
                    </span>
                    <span className="text-sm text-[var(--kinoshi-text)]/50">
                      ({(exitFeeBps / 100).toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[var(--kinoshi-text)]/60">
                  Frais prélevés lors des retraits (0-1000 basis points = 0-10%)
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 justify-center pt-4 border-t border-[var(--kinoshi-border)]/30">
                <KinoshiButton onClick={saveExitFee} disabled={isSavingFees}>
                  {isSavingFees
                    ? 'Mise à jour...'
                    : 'Mettre à jour les frais de sortie'}
                </KinoshiButton>
                <KinoshiButton
                  variant="outline"
                  onClick={applyManagementFee}
                  disabled={isApplyingManagementFee}
                >
                  {isApplyingManagementFee
                    ? 'Application...'
                    : 'Appliquer frais de gestion'}
                </KinoshiButton>
              </div>
            </div>
          )}
        </KinoshiCardContent>
      </KinoshiCard>
    </div>
  )
}

export default AdminPanel
