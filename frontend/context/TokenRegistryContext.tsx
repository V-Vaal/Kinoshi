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
import type { Abi } from 'viem'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { vaultAddress } from '@/constants'

// Types pour TokenRegistry
export interface TokenInfo {
  tokenAddress: string
  symbol: string
  decimals: number
  isRegistered: boolean
}

export interface AssetAllocation {
  token: string
  weight: bigint
  active: boolean
}

// Types exposés par le contexte
export interface TokenRegistryContextType {
  registeredTokens: TokenInfo[]
  allocations: AssetAllocation[]
  isLoading: boolean
  fetchTokenData: () => Promise<void>
}

const TokenRegistryContext = createContext<
  TokenRegistryContextType | undefined
>(undefined)

export const useTokenRegistry = () => {
  const ctx = useContext(TokenRegistryContext)
  if (!ctx)
    throw new Error(
      'useTokenRegistry doit être utilisé dans un TokenRegistryProvider'
    )
  return ctx
}

export const TokenRegistryProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const { isConnected } = useAccount()
  const [registeredTokens, setRegisteredTokens] = useState<TokenInfo[]>([])
  const [allocations, setAllocations] = useState<AssetAllocation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Récupère les tokens enregistrés et les allocations
  const fetchTokenData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Récupérer le registry depuis le vault
      const registryAddress = (await readContract(wagmiConfig, {
        abi: [
          {
            inputs: [],
            name: 'registry',
            outputs: [{ type: 'address', name: '' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: vaultAddress as `0x${string}`,
        functionName: 'registry',
      })) as string

      // Récupérer les tokens enregistrés
      const tokens = (await readContract(wagmiConfig, {
        abi: [
          {
            inputs: [],
            name: 'getRegisteredTokens',
            outputs: [
              {
                components: [
                  { type: 'address', name: 'tokenAddress' },
                  { type: 'string', name: 'symbol' },
                  { type: 'uint8', name: 'decimals' },
                  { type: 'bool', name: 'isRegistered' },
                ],
                type: 'tuple[]',
                name: 'tokens',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: registryAddress as `0x${string}`,
        functionName: 'getRegisteredTokens',
      })) as TokenInfo[]

      // Récupérer les allocations du vault
      const vaultAllocations = (await readContract(wagmiConfig, {
        abi: [
          {
            inputs: [],
            name: 'getAllocations',
            outputs: [
              {
                components: [
                  { type: 'address', name: 'token' },
                  { type: 'uint256', name: 'weight' },
                  { type: 'bool', name: 'active' },
                ],
                type: 'tuple[]',
                name: '',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: vaultAddress as `0x${string}`,
        functionName: 'getAllocations',
      })) as AssetAllocation[]

      setRegisteredTokens(tokens)
      setAllocations(vaultAllocations)
    } catch (err) {
      console.error('Erreur lors de la récupération des tokens:', err)
      setRegisteredTokens([])
      setAllocations([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Rafraîchit à la connexion
  useEffect(() => {
    if (isConnected) {
      fetchTokenData()
    }
  }, [isConnected, fetchTokenData])

  const value: TokenRegistryContextType = {
    registeredTokens,
    allocations,
    isLoading,
    fetchTokenData,
  }

  return (
    <TokenRegistryContext.Provider value={value}>
      {children}
    </TokenRegistryContext.Provider>
  )
}
