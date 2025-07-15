'use client'

import React, { useState } from 'react'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useVault } from '@/context/VaultContext'
import { Button, Input } from '@/components/ui'
import { toast } from 'sonner'

const DepositForm: React.FC = () => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected } = useAccount()
  const { deposit, decimals } = useVault()

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
  )
}

export default DepositForm
