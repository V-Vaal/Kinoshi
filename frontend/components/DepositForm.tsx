'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { writeContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
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

  const { isConnected } = useAccount()
  const { previewDeposit, decimals } = useVault()

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
      if (!amount || !decimals || parseFloat(amount) <= 0) {
        setPreviewShares(null)
        setPreviewError(null)
        return
      }

      setIsPreviewLoading(true)
      setPreviewError(null)

      try {
        const amountBigInt = parseUnits(amount, decimals)
        const shares = await previewDeposit(amountBigInt)

        // Formater les parts avec 2 décimales
        const formattedShares = formatUnits(shares, decimals)
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
  }, [amount, decimals, previewDeposit])

  const handleDeposit = async () => {
    setContractError(null)
    if (!amount || !decimals) return
    setIsLoading(true)
    try {
      const amountBigInt = parseUnits(amount, decimals)
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'deposit',
        args: [amountBigInt],
      })
      setTxHash(hash as `0x${string}`)
    } catch (error) {
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
