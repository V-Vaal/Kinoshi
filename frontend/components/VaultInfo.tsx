'use client'

import React from 'react'
import { formatUnits } from 'viem'
import { useVault } from '@/context/VaultContext'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
} from '@/components/ui'

interface VaultInfoProps {
  className?: string
}

const VaultInfo: React.FC<VaultInfoProps> = ({ className }) => {
  const { totalAssets, userShares, decimals } = useVault()

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

  return (
    <KinoshiCard variant="outlined" className={className}>
      <KinoshiCardHeader>
        <KinoshiCardTitle>Informations du Vault</KinoshiCardTitle>
      </KinoshiCardHeader>
      <KinoshiCardContent>
        <div className="space-y-6">
          {/* Tableau récapitulatif */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--kinoshi-border)]/30">
                  <th className="text-left py-2 font-serif font-extrabold text-[var(--kinoshi-text)]">
                    Métrique
                  </th>
                  <th className="text-right py-2 font-serif font-extrabold text-[var(--kinoshi-text)]">
                    Valeur
                  </th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b border-[var(--kinoshi-border)]/20">
                  <td className="py-3 font-sans font-medium text-[var(--kinoshi-text)]/90">
                    Total des actifs
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-[var(--kinoshi-primary)]">
                    {formatValue(totalAssets, decimals)}
                  </td>
                </tr>
                <tr className="border-b border-[var(--kinoshi-border)]/20">
                  <td className="py-3 font-sans font-medium text-[var(--kinoshi-text)]/90">
                    Vos parts
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-[var(--kinoshi-text)]">
                    {formatValue(userShares, decimals)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-sans font-medium text-[var(--kinoshi-text)]/90">
                    Décimales (debug)
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-[var(--kinoshi-text)]">
                    {decimals !== null ? decimals : 'Non disponible'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section dernier rafraîchissement */}
          <div className="pt-4 border-t border-[var(--kinoshi-border)]/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-sans font-medium text-[var(--kinoshi-text)]/70">
                Dernier rafraîchissement
              </span>
              <span className="text-sm font-mono text-[var(--kinoshi-text)]/80">
                {new Date().toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </KinoshiCardContent>
    </KinoshiCard>
  )
}

export default VaultInfo
