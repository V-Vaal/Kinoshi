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

interface RedeemFormProps {
  vaultAddress: string
  usdcAddress: string
}

export function RedeemForm({ vaultAddress }: RedeemFormProps) {
  const { address, isConnected } = useAccount()
  const [shares, setShares] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock shares balance for demo
  const sharesBalance = '1000.0'

  const handleRedeem = async () => {
    if (!isConnected || !address) {
      toast.error('Veuillez vous connecter')
      return
    }

    if (!shares || parseFloat(shares) <= 0) {
      toast.error('Montant de parts invalide')
      return
    }

    if (parseFloat(shares) > parseFloat(sharesBalance)) {
      toast.error('Montant de parts insuffisant')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulated redeem for demo
      toast.info('Fonctionnalité à implémenter - Retrait')
      setShares('')
    } catch (error) {
      console.error('Erreur lors du retrait:', error)
      toast.error('Erreur lors du retrait')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setShares(value)
    }
  }

  const handleMaxShares = () => {
    setShares(sharesBalance)
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Retrait</CardTitle>
          <CardDescription>
            Connectez-vous pour retirer vos parts du vault
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retrait USDC</CardTitle>
        <CardDescription>
          Retirez vos parts du vault pour recevoir des USDC
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shares">Parts à retirer</Label>
          <div className="flex space-x-2">
            <Input
              id="shares"
              type="text"
              placeholder="0.00"
              value={shares}
              onChange={handleSharesChange}
              disabled={isLoading}
            />
            <Button 
              variant="outline" 
              onClick={handleMaxShares}
              disabled={isLoading}
            >
              Max
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Solde disponible: {sharesBalance} parts
          </p>
        </div>
        
        <Button 
          onClick={handleRedeem}
          disabled={isLoading || !shares || parseFloat(shares) <= 0 || parseFloat(shares) > parseFloat(sharesBalance)}
          className="w-full"
        >
          {isLoading ? 'Retrait en cours...' : 'Retirer'}
        </Button>

        {shares && parseFloat(shares) > 0 && (
          <div className="text-sm text-muted-foreground">
            <p>Vous recevrez environ {shares} USDC</p>
            <p className="text-xs">Prix fictifs (démo) - Frais de sortie appliqués</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
