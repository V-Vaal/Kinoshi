'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Badge } from './ui/badge'

interface VaultInfoProps {
  vaultAddress: string
  usdcAddress: string
  strategyId: string
}

export function VaultInfo({ strategyId }: VaultInfoProps) {
  // Mock data for demo
  const totalAssets = '50000.0'
  const totalSupply = '50000.0'
  const sharePrice = 1.0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Informations du Vault
          <Badge variant="secondary">{strategyId}</Badge>
        </CardTitle>
        <CardDescription>
          État actuel du vault et de la stratégie d&apos;investissement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Assets
            </p>
            <p className="text-2xl font-bold">{totalAssets} USDC</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Supply
            </p>
            <p className="text-2xl font-bold">{totalSupply} parts</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Prix de la part
          </p>
          <p className="text-xl font-semibold">{sharePrice.toFixed(6)} USDC</p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">
            Allocation de la stratégie
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>USDC</span>
              <span>25%</span>
            </div>
            <div className="flex justify-between">
              <span>Or</span>
              <span>25%</span>
            </div>
            <div className="flex justify-between">
              <span>Bitcoin</span>
              <span>25%</span>
            </div>
            <div className="flex justify-between">
              <span>Obligations</span>
              <span>15%</span>
            </div>
            <div className="flex justify-between">
              <span>Actions</span>
              <span>10%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Prix fictifs (démo) - Allocation équilibrée
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Frais</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Frais de sortie</span>
              <span>0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Frais de gestion</span>
              <span>1%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
