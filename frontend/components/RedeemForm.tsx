'use client'

import React, { useState } from 'react'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useVault } from '@/context/VaultContext'
import { Button, Input } from '@/components/ui'
import { toast } from 'sonner'

const RedeemForm: React.FC = () => {
  const [shares, setShares] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected } = useAccount()
  const { redeem, decimals, userShares } = useVault()

  const handleRedeem = async () => {
    if (!shares || !decimals) return

    setIsLoading(true)
    try {
      const sharesBigInt = parseUnits(shares, decimals)
      await redeem(sharesBigInt)
      toast.success('Retrait effectué avec succès !')
      setShares('')
    } catch (error) {
      console.error('Erreur lors du retrait:', error)
      toast.error('Erreur lors du retrait. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  // Validation : vérifier que l'utilisateur a assez de parts
  const isValidShares = () => {
    if (!shares || !decimals || !userShares) return false
    try {
      const sharesToRedeem = parseUnits(shares, decimals)
      return sharesToRedeem > 0n && sharesToRedeem <= userShares
    } catch {
      return false
    }
  }

  const isDisabled = !isConnected || !isValidShares() || isLoading

  return (
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
  )
}

export default RedeemForm
