'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useVault } from '@/context/VaultContext'
import { Button, Input } from '@/components/ui'
import { toast } from 'sonner'
import Alert from './Alert'
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as readonly unknown[]
const errorMessages: Record<string, string> = {
  Paused: 'Les dépôts/retraits sont actuellement suspendus.',
  ZeroAmount: 'Veuillez saisir un montant supérieur à 0.',
  Unauthorized: 'Action non autorisée.',
}

const RedeemForm: React.FC = () => {
  const [shares, setShares] = useState('')
  const [isEstimating, setIsEstimating] = useState(false)
  const [previewAmount, setPreviewAmount] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)

  const { address, isConnected } = useAccount()
  const { previewRedeem, userShares, decimals } = useVault()

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
        const formatted = formatUnits(amount, decimals)
        const parts = formatted.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        const result =
          parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0]
        setPreviewAmount(result)
      } catch {
        setPreviewError('Erreur lors de l’estimation')
        setPreviewAmount(null)
      } finally {
        setIsEstimating(false)
      }
    }
    estimate()
  }, [shares, decimals, previewRedeem])

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
      await waitForTransactionReceipt(wagmiConfig, { hash })
      toast.success('Retrait effectué avec succès !')
      setShares('')
    } catch (error) {
      let message = 'Erreur lors du retrait. Veuillez réessayer.'
      if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        const match = /Custom error: (\w+)/.exec((error as { message: string }).message)
        if (match && errorMessages[match[1]]) {
          message = errorMessages[match[1]]
        }
      }
      setContractError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = !isConnected || !isValidShares() || isLoading

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
          {isLoading ? 'Retire...' : 'Retirer'}
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
      <Alert
        message="⚠️ Le résultat de previewDeposit() est estimatif et peut varier selon l’exécution réelle."
        className="mt-4"
      />
    </div>
  )
}

export default RedeemForm
