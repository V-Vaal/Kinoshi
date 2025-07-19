'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { useTokenRegistry } from './TokenRegistryContext'
import { useVault } from './VaultContext'

// Types pour les balances RWA
export interface RWABalance {
  symbol: string
  tokenAddress: string
  balance: bigint
  decimals: number
  price: bigint
  value: number // Valeur en USDC
  percent: number // Pourcentage d'allocation
}

// Types pour le contexte
export interface RWAContextType {
  rwaBalances: RWABalance[]
  totalValue: number
  isLoading: boolean
  error: string | null
  refreshRWABalances: () => Promise<void>
}

const RWAContext = createContext<RWAContextType | undefined>(undefined)

export const useRWA = () => {
  const ctx = useContext(RWAContext)
  if (!ctx) throw new Error('useRWA doit être utilisé dans un RWAProvider')
  return ctx
}

export const RWAProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount()
  const { allocations, registeredTokens } = useTokenRegistry()
  const { userPortfolioValue } = useVault()
  const [rwaBalances, setRwaBalances] = useState<RWABalance[]>([])
  const [totalValue, setTotalValue] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRWABalances = useCallback(async () => {
    if (
      !isConnected ||
      !address ||
      !allocations.length ||
      !registeredTokens.length ||
      !userPortfolioValue
    ) {
      setRwaBalances([])
      setTotalValue(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Convertir userPortfolioValue en nombre (userPortfolioValue est en 18 décimales)
      const portfolioValueNumber = parseFloat(
        formatUnits(userPortfolioValue, 18)
      )

      // Calculer la répartition basée sur les allocations
      const rwaExposures = allocations
        .filter((a) => a.active)
        .map((allocation) => {
          const tokenInfo = registeredTokens.find(
            (t) =>
              t.tokenAddress.toLowerCase() === allocation.token.toLowerCase()
          )
          if (!tokenInfo) {
            return null
          }

          // Convertir le weight en pourcentage (weight est en 18 decimals)
          const weightPercent =
            parseFloat(formatUnits(allocation.weight, 18)) * 100

          // Calculer la valeur allouée selon la part utilisateur
          const allocatedValue = portfolioValueNumber * (weightPercent / 100)

          return {
            symbol: tokenInfo.symbol,
            tokenAddress: allocation.token,
            balance: BigInt(0), // Pas utilisé dans cette logique
            decimals: 18, // Pas utilisé dans cette logique
            price: BigInt(0), // Pas utilisé dans cette logique
            value: allocatedValue,
            percent: Math.round(weightPercent * 100) / 100, // Pourcentage d'allocation
          }
        })
        .filter(Boolean) as RWABalance[]

      setRwaBalances(rwaExposures)
      setTotalValue(portfolioValueNumber)
    } catch (err) {
      console.error('Erreur lors du calcul des allocations RWA:', err)
      setError('Erreur lors du calcul des valeurs RWA')
      setRwaBalances([])
      setTotalValue(0)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, allocations, registeredTokens, userPortfolioValue])

  // Rafraîchir à la connexion et changement d'adresse
  useEffect(() => {
    if (isConnected && address) {
      fetchRWABalances()
    } else {
      setRwaBalances([])
      setTotalValue(0)
    }
  }, [isConnected, address, fetchRWABalances])

  // Rafraîchir quand les allocations ou le portefeuille changent
  useEffect(() => {
    if (
      isConnected &&
      address &&
      allocations.length > 0 &&
      userPortfolioValue
    ) {
      fetchRWABalances()
    }
  }, [allocations, userPortfolioValue, fetchRWABalances])

  const value: RWAContextType = {
    rwaBalances,
    totalValue,
    isLoading,
    error,
    refreshRWABalances: fetchRWABalances,
  }

  return <RWAContext.Provider value={value}>{children}</RWAContext.Provider>
}
