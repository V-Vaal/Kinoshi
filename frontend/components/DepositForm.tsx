'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useVault } from '@/context/VaultContext'
import { Button, Input } from '@/components/ui'
import { toast } from 'sonner'

const DepositForm: React.FC = () => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewShares, setPreviewShares] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const { isConnected } = useAccount()
  const { deposit, previewDeposit, decimals } = useVault()

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
    if (!amount || !decimals) return

    setIsLoading(true)
    try {
      const amountBigInt = parseUnits(amount, decimals)
      await deposit(amountBigInt)
      toast.success('Dépôt effectué avec succès !')
      setAmount('')
    } catch (error) {
      console.error('Erreur lors du dépôt:', error)
      toast.error('Erreur lors du dépôt. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = !isConnected || !amount || isLoading

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
        <Button onClick={handleDeposit} disabled={isDisabled} className="px-6">
          {isLoading ? 'Dépose...' : 'Déposer'}
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
    </div>
  )
}

export default DepositForm
