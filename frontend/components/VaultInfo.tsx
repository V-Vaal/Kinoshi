'use client'

import React from 'react'
import { formatUnits } from 'viem'
import { useVault } from '@/context/VaultContext'
import { useAccount, useBalance } from 'wagmi'
import { mockTokenAddresses } from '@/constants'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
  KinoshiBadge,
} from '@/components/ui'

interface VaultInfoProps {
  className?: string
}

const VaultInfo: React.FC<VaultInfoProps> = ({ className }) => {
  const { totalAssets, userShares, decimals } = useVault()
  const { address } = useAccount()

  // Récupération du solde mUSDC
  const { data: usdcBalance } = useBalance({
    address,
    token: mockTokenAddresses.mUSDC as `0x${string}`,
  })

  // Skeleton simple
  const Skeleton = () => (
    <div className="animate-pulse h-6 bg-gray-200 rounded w-32" />
  )

  // Formattage
  const formatValue = (
    value: bigint | null,
    decimals: number | null
  ): string => {
    if (value === null || decimals === null) return '—'
    try {
      const formatted = formatUnits(value, decimals)
      const parts = formatted.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      const result =
        parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0]
      return `${result} USDC`
    } catch {
      return 'Erreur'
    }
  }

  // Formattage du solde USDC
  const formatUSDCBalance = (): string => {
    if (!usdcBalance) return '—'
    try {
      const formatted = Number(usdcBalance.formatted)
      return `${formatted.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDC`
    } catch {
      return 'Erreur'
    }
  }

  // Badge démo (à adapter selon logique réelle)
  const isDemo = true

  return (
    <KinoshiCard variant="outlined" className={className}>
      <KinoshiCardHeader className="flex flex-row items-center gap-2">
        <KinoshiCardTitle>Votre investissement</KinoshiCardTitle>
        {isDemo && (
          <KinoshiBadge variant="warning">USDC fictif (démo)</KinoshiBadge>
        )}
      </KinoshiCardHeader>
      <KinoshiCardContent>
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-sans text-[var(--kinoshi-text)]/70 mb-1">
              Montant total investi
            </div>
            <div className="text-2xl font-serif font-extrabold text-[var(--kinoshi-primary)]">
              {totalAssets === null || decimals === null ? (
                <Skeleton />
              ) : (
                formatValue(totalAssets, decimals)
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-[var(--kinoshi-text)]/70 mb-1">
              Vos parts détenues dans le vault
            </div>
            <div className="text-xl font-mono font-semibold text-[var(--kinoshi-text)]">
              {userShares === null || decimals === null ? (
                <Skeleton />
              ) : (
                formatValue(userShares, decimals)
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-[var(--kinoshi-text)]/70 mb-1">
              Solde disponible
            </div>
            <div className="text-xl font-mono font-semibold text-green-500">
              {!address ? <Skeleton /> : formatUSDCBalance()}
            </div>
          </div>
        </div>
      </KinoshiCardContent>
    </KinoshiCard>
  )
}

export default VaultInfo
