'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { writeContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress, mockTokenAddresses } from '@/constants'
import { useVault } from '@/context/VaultContext'
import {
  Button,
  Input,
  KinoshiCard,
  KinoshiCardContent,
  KinoshiCardHeader,
  KinoshiCardTitle,
} from '@/components/ui'
import { toast } from 'sonner'
import Link from 'next/link'
import Alert from './Alert'
import { useWaitForTransactionReceipt } from 'wagmi'
import { readContract } from 'wagmi/actions'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as readonly unknown[]

const errorMessages: Record<string, string> = {
  Paused: 'Les dépôts/retraits sont actuellement suspendus.',
  ZeroAmount: 'Veuillez saisir un montant supérieur à 0.',
  Unauthorized: 'Action non autorisée.',
}

const DepositForm: React.FC = () => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewShares, setPreviewShares] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [hasRiskProfile, setHasRiskProfile] = useState<boolean | null>(null)
  const [contractError, setContractError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

  const { isConnected, address: userAddress } = useAccount()
  const { previewDeposit, decimals, assetDecimals } = useVault()

  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  useEffect(() => {
    if (isTxSuccess) {
      toast.success('✅ Transaction confirmée !')
      setAmount('')
      setTxHash(undefined)
    }
    if (isTxError) {
      setContractError('Erreur lors de la confirmation de la transaction.')
      setTxHash(undefined)
    }
  }, [isTxSuccess, isTxError])

  // Vérifier si l'utilisateur a un profil de risque
  useEffect(() => {
    let savedProfile: string | null = null
    if (typeof window !== 'undefined') {
      savedProfile = localStorage.getItem('kinoshi-risk-profile')
    }
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        setHasRiskProfile(!!profile && profile.score && profile.profile)
      } catch {
        setHasRiskProfile(false)
      }
    } else {
      setHasRiskProfile(false)
    }
  }, [])

  // useEffect pour prévisualiser le dépôt quand le montant change
  useEffect(() => {
    const previewDepositAmount = async () => {
      if (!amount || !assetDecimals || parseFloat(amount) <= 0) {
        setPreviewShares(null)
        setPreviewError(null)
        return
      }

      setIsPreviewLoading(true)
      setPreviewError(null)

      try {
        const amountBigInt = parseUnits(amount, assetDecimals)
        const shares = await previewDeposit(amountBigInt)

        // Formater les parts avec 2 décimales (utiliser decimals du Vault pour l'affichage)
        const formattedShares = formatUnits(shares, decimals || 18)
        const parts = formattedShares.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        const result =
          parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0]

        setPreviewShares(result)
      } catch (error) {
        console.error('Erreur lors de la prévisualisation:', error)
        setPreviewError('Erreur lors du calcul des parts')
        setPreviewShares(null)
      } finally {
        setIsPreviewLoading(false)
      }
    }

    previewDepositAmount()
  }, [amount, assetDecimals, decimals, previewDeposit])

  const handleDeposit = async () => {
    console.log('🚀 Début handleDeposit')
    setContractError(null)

    // Vérifications initiales
    console.log('📋 Vérifications:', {
      amount,
      assetDecimals,
      decimals,
      isConnected,
    })
    console.log('🔍 Décimales:', {
      vaultDecimals: decimals,
      assetDecimals: assetDecimals,
    })
    if (!amount || !assetDecimals || !isConnected) {
      console.log('❌ Vérifications échouées')
      return
    }

    setIsLoading(true)
    try {
      const amountBigInt = parseUnits(amount, assetDecimals)
      console.log('💰 Montant parsé:', {
        amount,
        amountBigInt: amountBigInt.toString(),
      })

      // Adresse utilisateur déjà récupérée au niveau du composant
      console.log('👤 Adresse utilisateur:', userAddress)

      if (!userAddress) {
        console.log('❌ Adresse utilisateur non disponible')
        throw new Error('Adresse utilisateur non disponible')
      }

      // Vérifier l'allowance avant d'appeler approve
      console.log("🔍 Vérification de l'allowance...")
      let allowance = await readContract(wagmiConfig, {
        abi: [
          {
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: mockTokenAddresses.mUSDC as `0x${string}`, // MockUSDC
        functionName: 'allowance',
        args: [userAddress, vaultAddress],
      })
      console.log('📊 Allowance actuelle:', allowance.toString())
      console.log('📊 Montant à déposer:', amountBigInt.toString())

      if (allowance < amountBigInt) {
        // Appeler approve uniquement si nécessaire
        console.log('✅ Début approbation USDC...')
        console.log('📝 Approbation pour:', {
          spender: vaultAddress,
          amount: amountBigInt.toString(),
          tokenAddress: mockTokenAddresses.mUSDC,
        })
        const approveHash = await writeContract(wagmiConfig, {
          abi: [
            {
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              name: 'approve',
              outputs: [{ name: '', type: 'bool' }],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: mockTokenAddresses.mUSDC as `0x${string}`, // MockUSDC address
          functionName: 'approve',
          args: [vaultAddress, amountBigInt],
        })
        console.log('✅ Approve envoyé, hash:', approveHash)
        // Attendre la confirmation de l'approve
        await import('wagmi/actions').then(({ waitForTransactionReceipt }) =>
          waitForTransactionReceipt(wagmiConfig, { hash: approveHash })
        )
        // Relire l'allowance après approve
        allowance = await readContract(wagmiConfig, {
          abi: [
            {
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
              ],
              name: 'allowance',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: mockTokenAddresses.mUSDC as `0x${string}`, // MockUSDC
          functionName: 'allowance',
          args: [userAddress, vaultAddress],
        })
        console.log(
          '📊 Nouvelle allowance après approve:',
          allowance.toString()
        )
        if (allowance < amountBigInt) {
          throw new Error(
            `Allowance insuffisante après approve: ${allowance} < ${amountBigInt}`
          )
        }
      }

      // Appeler deposit avec deux arguments
      console.log('🏦 Début dépôt...')
      console.log('📝 Dépôt avec:', {
        amount: amountBigInt.toString(),
        receiver: userAddress,
        vaultAddress: vaultAddress,
      })

      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'deposit',
        args: [amountBigInt, userAddress],
      })
      console.log('✅ Dépôt réussi, hash:', hash)
      setTxHash(hash as `0x${string}`)
    } catch (error) {
      console.error('❌ Erreur détaillée:', error)
      console.error("❌ Type d'erreur:", typeof error)
      console.error("❌ Message d'erreur:", (error as Error)?.message)
      console.error("❌ Code d'erreur:", (error as { code?: unknown })?.code)
      console.error('❌ Stack trace:', (error as Error)?.stack)

      let message = 'Erreur lors du dépôt. Veuillez réessayer.'
      if (
        typeof error === 'object' &&
        error &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        const match = /Custom error: (\w+)/.exec(
          (error as { message: string }).message
        )
        if (match && errorMessages[match[1]]) {
          message = errorMessages[match[1]]
        }
      }
      setContractError(message)
    } finally {
      setIsLoading(false)
      console.log('🏁 Fin handleDeposit')
    }
  }

  const isDisabled = !isConnected || !amount || isLoading

  // Si l'utilisateur n'a pas de profil de risque, afficher le message d'alerte
  if (hasRiskProfile === false) {
    return (
      <KinoshiCard variant="outlined" className="max-w-2xl mx-auto">
        <KinoshiCardHeader>
          <KinoshiCardTitle className="flex items-center gap-2">
            ⚠️ Vous devez d'abord définir votre profil investisseur
          </KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent className="space-y-4">
          <p className="text-[var(--kinoshi-text)]/90 font-sans font-medium">
            Pour pouvoir déposer des fonds, vous devez d'abord compléter votre
            profil de risque. Cela nous permet de vous proposer les stratégies
            d'investissement les plus adaptées à votre profil.
          </p>
          <div className="flex justify-center">
            <Link href="/profil">
              <Button className="px-6">Définir mon profil</Button>
            </Link>
          </div>
        </KinoshiCardContent>
      </KinoshiCard>
    )
  }

  // Si on est en train de vérifier le profil, afficher un chargement
  if (hasRiskProfile === null) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-[var(--kinoshi-text)]/70 font-sans font-medium">
            Vérification de votre profil...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Montant en USDC"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        <Button
          onClick={handleDeposit}
          disabled={isDisabled || isTxLoading}
          className="px-6"
        >
          {isLoading || isTxLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Transaction en cours…
            </span>
          ) : (
            'Déposer'
          )}
        </Button>
      </div>

      {/* Affichage de la prévisualisation */}
      {amount && parseFloat(amount) > 0 && (
        <div className="text-sm">
          {isPreviewLoading ? (
            <p className="text-[var(--kinoshi-text)]/70 font-sans font-medium">
              Calcul des parts...
            </p>
          ) : previewError ? (
            <p className="text-red-500 font-sans font-medium">{previewError}</p>
          ) : previewShares ? (
            <p className="text-[var(--kinoshi-primary)] font-sans font-medium">
              Parts estimées : {previewShares}
            </p>
          ) : decimals === null ? (
            <p className="text-[var(--kinoshi-text)]/70 font-sans font-medium">
              Impossible de calculer les parts (décimales non disponibles)
            </p>
          ) : null}
        </div>
      )}
      {contractError && <Alert message={contractError} className="mt-2" />}
      {isTxError && txError && (
        <Alert
          message={txError.message || 'Erreur lors de la transaction.'}
          className="mt-2"
        />
      )}
      <Alert
        message="⚠️ Le résultat de previewDeposit() est estimatif et peut varier selon l’exécution réelle."
        className="mt-4"
      />
    </div>
  )
}

export default DepositForm
