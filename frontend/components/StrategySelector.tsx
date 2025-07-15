'use client'

import React from 'react'
import { formatUnits } from 'viem'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
} from '@/components/ui'

interface StrategySelectorProps {
  className?: string
}

const StrategySelector: React.FC<StrategySelectorProps> = ({ className }) => {
  const { registeredTokens, allocations, isLoading } = useTokenRegistry()

  // Fonction pour calculer le pourcentage de pondération
  const getWeightPercentage = (weight: bigint): string => {
    const percentage = Number(formatUnits(weight, 18)) * 100
    return `${percentage.toFixed(1)}%`
  }

  // Fonction pour trouver l'allocation d'un token
  const getAllocationForToken = (tokenAddress: string) => {
    return allocations.find(
      (allocation) =>
        allocation.token.toLowerCase() === tokenAddress.toLowerCase()
    )
  }

  // Skeleton pour le loading
  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )

  if (isLoading) {
    return (
      <KinoshiCard variant="outlined" className={className}>
        <KinoshiCardHeader>
          <KinoshiCardTitle>Stratégie d'investissement</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} />
            ))}
          </div>
        </KinoshiCardContent>
      </KinoshiCard>
    )
  }

  return (
    <KinoshiCard variant="outlined" className={className}>
      <KinoshiCardHeader>
        <KinoshiCardTitle>Stratégie d'investissement</KinoshiCardTitle>
      </KinoshiCardHeader>
      <KinoshiCardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--kinoshi-border)]/30">
                <th className="text-left py-2 font-serif font-extrabold text-[var(--kinoshi-text)]">
                  Token
                </th>
                <th className="text-right py-2 font-serif font-extrabold text-[var(--kinoshi-text)]">
                  Pondération
                </th>
                <th className="text-center py-2 font-serif font-extrabold text-[var(--kinoshi-text)]">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {registeredTokens.map((token) => {
                const allocation = getAllocationForToken(token.tokenAddress)
                const isActive = allocation?.active ?? false
                const weight = allocation?.weight ?? 0n

                return (
                  <tr
                    key={token.tokenAddress}
                    className={`border-b border-[var(--kinoshi-border)]/20 ${
                      !isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 font-sans font-medium text-[var(--kinoshi-text)]/90">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${!isActive ? 'text-[var(--kinoshi-text)]/60' : 'text-[var(--kinoshi-text)]'}`}
                        >
                          {token.symbol}
                        </span>
                        {!isActive && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Désactivé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-[var(--kinoshi-primary)]">
                      {weight > 0n ? getWeightPercentage(weight) : '—'}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {registeredTokens.length === 0 && (
          <div className="text-center py-8 text-[var(--kinoshi-text)]/70">
            Aucun token enregistré
          </div>
        )}
      </KinoshiCardContent>
    </KinoshiCard>
  )
}

export default StrategySelector
