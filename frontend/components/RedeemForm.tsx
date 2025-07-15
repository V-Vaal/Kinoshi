'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useVault } from '@/context/VaultContext'
import { Button, Input } from '@/components/ui'
import { toast } from 'sonner'
import Alert from './Alert'

const RedeemForm: React.FC = () => {
  const [shares, setShares] = useState('')
  const [isEstimating, setIsEstimating] = useState(false)
  const [previewAmount, setPreviewAmount] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { address, isConnected } = useAccount()
  const { redeem, previewRedeem, userShares, decimals } = useVault()

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
    if (!shares || !decimals || !address) return
    setIsLoading(true)
    try {
      const sharesBigInt = parseUnits(shares, decimals)
      await redeem(sharesBigInt, address, address)
      toast.success('Retrait effectué avec succès !')
      setShares('')
    } catch (error) {
      console.error('Erreur lors du retrait:', error)
      toast.error('Erreur lors du retrait. Veuillez réessayer.')
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
      <Alert
        message="⚠️ Le résultat de previewDeposit() est estimatif et peut varier selon l’exécution réelle."
        className="mt-4"
      />
    </div>
  )
}

export default RedeemForm
