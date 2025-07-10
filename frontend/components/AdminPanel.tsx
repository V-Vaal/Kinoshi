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

interface AdminPanelProps {
  vaultAddress: string
  tokenRegistryAddress: string
}

export function AdminPanel({ vaultAddress }: AdminPanelProps) {
  const { isConnected } = useAccount()
  const [exitFeeBps, setExitFeeBps] = useState('50') // 0.5%
  const [managementFeeBps, setManagementFeeBps] = useState('100') // 1%
  const [isLoading, setIsLoading] = useState(false)

  // Mock prices for demo
  const [mockPrices, setMockPrices] = useState({
    gold: '2000',
    btc: '45000',
    bonds: '100',
    equity: '50',
  })

  const handlePause = () => {
    setIsLoading(true)
    toast.info('Fonctionnalité à implémenter - Pause Vault')
    setIsLoading(false)
  }

  const handleUnpause = () => {
    setIsLoading(true)
    toast.info('Fonctionnalité à implémenter - Unpause Vault')
    setIsLoading(false)
  }

  const handleUpdateFees = () => {
    // This would be implemented with actual contract calls
    toast.info('Fonctionnalité à implémenter - Mise à jour des frais')
  }

  const handleUpdatePrices = () => {
    // This would be implemented with actual contract calls
    toast.info('Fonctionnalité à implémenter - Mise à jour des prix fictifs')
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder aux fonctions d&apos;administration
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contrôles d&apos;Administration</CardTitle>
          <CardDescription>
            Fonctions réservées à l&apos;administrateur du vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button
              onClick={handlePause}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? 'Mise en pause...' : 'Pause Vault'}
            </Button>
            <Button
              onClick={handleUnpause}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Réactivation...' : 'Unpause Vault'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration des Frais</CardTitle>
          <CardDescription>
            Modifier les frais appliqués par le vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exitFee">Frais de sortie (basis points)</Label>
              <Input
                id="exitFee"
                type="number"
                value={exitFeeBps}
                onChange={(e) => setExitFeeBps(e.target.value)}
                placeholder="50"
              />
              <p className="text-xs text-muted-foreground">
                Actuel: {parseInt(exitFeeBps) / 100}%
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="managementFee">
                Frais de gestion (basis points)
              </Label>
              <Input
                id="managementFee"
                type="number"
                value={managementFeeBps}
                onChange={(e) => setManagementFeeBps(e.target.value)}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Actuel: {parseInt(managementFeeBps) / 100}%
              </p>
            </div>
          </div>
          <Button onClick={handleUpdateFees} className="w-full">
            Mettre à jour les frais
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prix Fictifs (Démo)</CardTitle>
          <CardDescription>
            Modifier les prix des actifs pour la démonstration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goldPrice">Prix Or (USD/oz)</Label>
              <Input
                id="goldPrice"
                type="number"
                value={mockPrices.gold}
                onChange={(e) =>
                  setMockPrices((prev) => ({ ...prev, gold: e.target.value }))
                }
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btcPrice">Prix Bitcoin (USD)</Label>
              <Input
                id="btcPrice"
                type="number"
                value={mockPrices.btc}
                onChange={(e) =>
                  setMockPrices((prev) => ({ ...prev, btc: e.target.value }))
                }
                placeholder="45000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bondsPrice">Prix Obligations (USD)</Label>
              <Input
                id="bondsPrice"
                type="number"
                value={mockPrices.bonds}
                onChange={(e) =>
                  setMockPrices((prev) => ({ ...prev, bonds: e.target.value }))
                }
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equityPrice">Prix Actions (USD)</Label>
              <Input
                id="equityPrice"
                type="number"
                value={mockPrices.equity}
                onChange={(e) =>
                  setMockPrices((prev) => ({ ...prev, equity: e.target.value }))
                }
                placeholder="50"
              />
            </div>
          </div>
          <Button onClick={handleUpdatePrices} className="w-full">
            Mettre à jour les prix
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Ces prix sont fictifs et utilisés uniquement pour la démonstration
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
