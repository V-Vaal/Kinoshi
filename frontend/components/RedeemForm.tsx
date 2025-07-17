'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useVault } from '@/context/VaultContext'
import { Button, Input } from '@/components/ui'
import { toast } from 'sonner'
import Alert from './Alert'
import { writeContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import { useWaitForTransactionReceipt } from 'wagmi'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as readonly unknown[]
const errorMessages: Record<string, string> = {
  Paused: 'Les dépôts/retraits sont actuellement suspendus.',
  ZeroAmount: 'Veuillez saisir un montant supérieur à 0.',
  Unauthorized: 'Action non autorisée.',
}

const RedeemForm: React.FC = () => {
  const [shares, setShares] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewAmount, setPreviewAmount] = useState<string | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [contractError, setContractError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

  const { isConnected, address } = useAccount()
  const { userShares, previewRedeem, decimals, assetDecimals } = useVault()

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
      setShares('')
      setTxHash(undefined)
    }
    if (isTxError) {
      setContractError('Erreur lors de la confirmation de la transaction.')
      setTxHash(undefined)
    }
  }, [isTxSuccess, isTxError])

  // Estimation du montant à retirer
  useEffect(() => {
    const estimate = async () => {
      if (!shares || !decimals || parseFloat(shares) <= 0) {
        setPreviewAmount(null)
        setPreviewError(null)
        return
      }
      setIsEstimating(true)
      setPreviewError(null)
      try {
        const sharesBigInt = parseUnits(shares, decimals)
        const amount = await previewRedeem(sharesBigInt)
        const formatted = formatUnits(amount, assetDecimals || 6) // Utiliser assetDecimals pour formater le montant USDC
        const parts = formatted.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        const result =
          parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0]
        setPreviewAmount(result)
      } catch {
        setPreviewError("Erreur lors de l'estimation")
        setPreviewAmount(null)
      } finally {
        setIsEstimating(false)
      }
    }
    estimate()
  }, [shares, decimals, assetDecimals, previewRedeem])

  // Validation
  const isValidShares = () => {
    if (!shares || !decimals || !userShares) return false
    try {
      const sharesToRedeem = parseUnits(shares, decimals)
      return sharesToRedeem > 0n && sharesToRedeem <= userShares
    } catch {
      return false
    }
  }

  const handleRedeem = async () => {
    setContractError(null)
    if (!shares || !decimals || !address) return
    setIsLoading(true)
    try {
      const sharesBigInt = parseUnits(shares, decimals)
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'redeem',
        args: [sharesBigInt, address, address],
      })
      setTxHash(hash as `0x${string}`)
    } catch (error) {
      let message = 'Erreur lors du retrait. Veuillez réessayer.'
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

  const isDisabled =
    !isConnected || !isValidShares() || isLoading || isTxLoading

  return (
    <div className="space-y-2">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Nombre de parts à retirer"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        <Button onClick={handleRedeem} disabled={isDisabled} className="px-6">
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
            'Retirer'
          )}
        </Button>
      </div>
      {/* Estimation */}
      {shares && parseFloat(shares) > 0 && (
        <div className="text-sm">
          {isEstimating ? (
            <span className="text-[var(--kinoshi-text)]/70 font-sans font-medium">
              Calcul de l’estimation...
            </span>
          ) : previewError ? (
            <span className="text-red-500 font-sans font-medium">
              {previewError}
            </span>
          ) : previewAmount ? (
            <span className="text-[var(--kinoshi-primary)] font-sans font-medium">
              Estimation du retrait : {previewAmount} USDC
            </span>
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

export default RedeemForm
