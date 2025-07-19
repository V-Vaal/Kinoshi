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
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { vaultAddress, mockOracleAddress } from '@/constants'
import mockPriceFeedAbi from '@/abis/MockPriceFeed.abi.json'
import { useTokenRegistry } from './TokenRegistryContext'
import { useVault } from './VaultContext'
import { useUserHistory } from '@/utils/useUserHistory'
import { formatUnits } from 'viem'

export interface RWABalance {
  symbol: string
  tokenAddress: string
  balance: bigint
  decimals: number
  price: bigint
  value: number
  percent: number
}

export interface RWAContextType {
  rwaBalances: RWABalance[]
  totalValue: number
  isLoading: boolean
  error: string | null
  fetchRWABalances: () => Promise<void>
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
  const { totalAssets } = useVault()
  const { history } = useUserHistory(address, 6)
  const [rwaBalances, setRwaBalances] = useState<RWABalance[]>([])
  const [totalValue, setTotalValue] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRWABalances = useCallback(async () => {
    if (
      !isConnected ||
      !address ||
      !allocations.length ||
      !registeredTokens.length
    ) {
      setRwaBalances([])
      setTotalValue(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Récupérer le total investi depuis l'historique
      const totalInvested =
        history
          .filter((item) => item.type === 'Dépôt')
          .reduce((sum, item) => sum + item.amount, 0) || 100 // Fallback à 100 si pas d'historique

      // Calculer la répartition basée sur les weights d'allocation
      const allocationPromises = allocations
        .filter((a) => a.active)
        .map(async (allocation) => {
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

          // Calculer la valeur allouée
          const allocatedValue = totalInvested * (weightPercent / 100)

          // Récupérer le prix via l'oracle
          const [price] = (await readContract(wagmiConfig, {
            abi: mockPriceFeedAbi.abi,
            address: mockOracleAddress as `0x${string}`,
            functionName: 'getPrice',
            args: [allocation.token],
          })) as [bigint, bigint]

          // Calculer la valeur actuelle (prix oracle en 18 decimals)
          const priceInUSD = parseFloat(formatUnits(price, 18))
          const currentValue = allocatedValue * (priceInUSD / 100) // Prix normalisé à 100

          return {
            symbol: tokenInfo.symbol,
            tokenAddress: allocation.token,
            allocatedValue,
            currentValue,
            weightPercent,
            price: priceInUSD,
          }
        })

      const results = (await Promise.all(allocationPromises)).filter(
        Boolean
      ) as {
        symbol: string
        tokenAddress: string
        allocatedValue: number
        currentValue: number
        weightPercent: number
        price: number
      }[]

      // Calculer le total de la valeur actuelle
      const totalCurrentValue = results.reduce(
        (sum, item) => sum + item.currentValue,
        0
      )

      // Créer les balances finales avec les pourcentages d'allocation
      const finalBalances = results.map((item) => ({
        symbol: item.symbol,
        tokenAddress: item.tokenAddress,
        balance: BigInt(0), // Pas utilisé dans cette logique
        decimals: 18, // Pas utilisé dans cette logique
        price: BigInt(0), // Pas utilisé dans cette logique
        value: item.currentValue,
        percent: Math.round(item.weightPercent * 100) / 100, // Pourcentage d'allocation
      }))

      setRwaBalances(finalBalances)
      setTotalValue(totalCurrentValue)
    } catch (err) {
      console.error('Erreur lors du calcul des allocations RWA:', err)
      setError('Erreur lors du calcul des valeurs RWA')
      setRwaBalances([])
      setTotalValue(0)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, allocations, registeredTokens])

  // Rafraîchir à la connexion et changement d'adresse
  useEffect(() => {
    if (isConnected && address) {
      fetchRWABalances()
    } else {
      setRwaBalances([])
      setTotalValue(0)
    }
  }, [isConnected, address, fetchRWABalances])

  // Écouter les événements de refresh
  useEffect(() => {
    const handler = () => fetchRWABalances()
    window.addEventListener('vault-refresh', handler)
    return () => window.removeEventListener('vault-refresh', handler)
  }, [fetchRWABalances])

  const value: RWAContextType = {
    rwaBalances,
    totalValue,
    isLoading,
    error,
    fetchRWABalances,
  }

  return <RWAContext.Provider value={value}>{children}</RWAContext.Provider>
}
