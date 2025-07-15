'use client'

import React from 'react'
import { formatUnits } from 'viem'
import { useVault } from '@/context/VaultContext'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
  KinoshiButton,
  KinoshiBadge,
  Progress,
} from '@/components/ui'
import { RefreshCw, Users, Coins, Shield } from 'lucide-react'
import UserDashboard from './UserDashboard';

const Dashboard: React.FC = () => {
  const { totalAssets, userShares, decimals, fetchVaultData } = useVault()

  // Fonction pour formater les valeurs bigint en string lisible
  const formatValue = (
    value: bigint | null,
    decimals: number | null
  ): string => {
    if (value === null || decimals === null) {
      return 'Non disponible'
    }

    try {
      const formatted = formatUnits(value, decimals)
      // Ajoute des espaces pour les milliers et limite à 2 décimales
      const parts = formatted.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      const result =
        parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0]
      return `${result} USDC`
    } catch {
      return 'Erreur de formatage'
    }
  }

  const handleRefresh = async () => {
    try {
      await fetchVaultData()
    } catch {
      console.error('Erreur lors du rafraîchissement')
    }
  }

  return (
    <div className="w-full space-y-6">
      <UserDashboard />
      {/* Header Card */}
      <KinoshiCard variant="elevated">
        <KinoshiCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <KinoshiCardTitle>Tableau de bord Kinoshi</KinoshiCardTitle>
              <p className="text-[var(--kinoshi-text)]/90 font-sans font-medium mt-1">
                Votre portefeuille d'investissement décentralisé
              </p>
            </div>
            <KinoshiBadge variant="success">
              <Shield className="w-3 h-3 mr-1" />
              Actif
            </KinoshiBadge>
          </div>
          <KinoshiButton
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="mt-4 w-fit"
          >
            <RefreshCw className="h-4 w-4" />
            Rafraîchir
          </KinoshiButton>
        </KinoshiCardHeader>
      </KinoshiCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KinoshiCard variant="default">
          <KinoshiCardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--kinoshi-primary)]/10 rounded-lg">
                <Coins className="w-5 h-5 text-[var(--kinoshi-primary)]" />
              </div>
              <div>
                <h3 className="font-serif font-extrabold text-[var(--kinoshi-accent)]">
                  Total des actifs
                </h3>
                <p className="text-sm text-[var(--kinoshi-text)]/90 font-sans font-medium">
                  Valeur totale sous gestion
                </p>
              </div>
            </div>
            <div className="text-3xl font-serif font-extrabold text-[var(--kinoshi-primary)] mb-2">
              {formatValue(totalAssets, decimals)}
            </div>
            <Progress value={100} className="h-2" />
          </KinoshiCardContent>
        </KinoshiCard>

        <KinoshiCard variant="default">
          <KinoshiCardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--kinoshi-gold)]/20 rounded-lg">
                <Users className="w-5 h-5 text-[var(--kinoshi-text)]" />
              </div>
              <div>
                <h3 className="font-serif font-extrabold text-[var(--kinoshi-accent)]">
                  Vos parts
                </h3>
                <p className="text-sm text-[var(--kinoshi-text)]/90 font-sans font-medium">
                  Parts détenues
                </p>
              </div>
            </div>
            <div className="text-3xl font-serif font-extrabold text-[var(--kinoshi-text)] mb-2">
              {formatValue(userShares, decimals)}
            </div>
            <Progress value={75} className="h-2" />
          </KinoshiCardContent>
        </KinoshiCard>
      </div>

      {/* Technical Info Card */}
      <KinoshiCard variant="outlined">
        <KinoshiCardHeader>
          <KinoshiCardTitle className="text-lg">
            Informations techniques
          </KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-[var(--kinoshi-text)]/90 font-sans font-medium">
                Décimales du token
              </div>
              <div className="font-mono font-medium text-[var(--kinoshi-text)]">
                {decimals !== null ? decimals : 'Non disponible'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[var(--kinoshi-text)]/90 font-sans font-medium">
                Total Assets (raw)
              </div>
              <div className="font-mono text-xs text-[var(--kinoshi-text)] break-all">
                {totalAssets !== null
                  ? totalAssets.toString()
                  : 'Non disponible'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[var(--kinoshi-text)]/90 font-sans font-medium">
                User Shares (raw)
              </div>
              <div className="font-mono text-xs text-[var(--kinoshi-text)] break-all">
                {userShares !== null ? userShares.toString() : 'Non disponible'}
              </div>
            </div>
          </div>
        </KinoshiCardContent>
      </KinoshiCard>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-[var(--kinoshi-text)]/90 font-sans font-medium">
          Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
        </p>
      </div>
    </div>
  )
}

export default Dashboard
