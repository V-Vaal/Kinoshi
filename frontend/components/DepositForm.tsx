'use client'

import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { toast } from 'sonner'

interface DepositFormProps {
  vaultAddress: string
  usdcAddress: string
  strategyId: string
}

export function DepositForm({ vaultAddress, usdcAddress, strategyId }: DepositFormProps) {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDeposit = async () => {
    if (!isConnected || !address) {
      toast.error('Veuillez vous connecter')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Montant invalide')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulated deposit for demo
      toast.info('Fonctionnalité à implémenter - Dépôt')
      setAmount('')
    } catch (error) {
      console.error('Erreur lors du dépôt:', error)
      toast.error('Erreur lors du dépôt')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dépôt</CardTitle>
          <CardDescription>
            Connectez-vous pour déposer des USDC dans le vault
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dépôt USDC</CardTitle>
        <CardDescription>
          Déposez des USDC pour recevoir des parts du vault selon la stratégie {strategyId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Montant USDC</Label>
          <Input
            id="amount"
            type="text"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
            disabled={isLoading}
          />
        </div>
        
        <Button 
          onClick={handleDeposit}
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
          className="w-full"
        >
          {isLoading ? 'Dépôt en cours...' : 'Déposer'}
        </Button>

        {amount && parseFloat(amount) > 0 && (
          <div className="text-sm text-muted-foreground">
            <p>Vous recevrez environ {amount} parts du vault</p>
            <p className="text-xs">Prix fictifs (démo)</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
