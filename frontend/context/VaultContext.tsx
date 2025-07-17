'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { useAccount, useChainId } from 'wagmi'
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from 'wagmi/actions'
import type { Abi } from 'viem'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

// Types exposés par le contexte
export interface VaultContextType {
  totalAssets: bigint | null
  userShares: bigint | null
  decimals: number | null
  assetDecimals: number | null // Ajout des décimales du token sous-jacent
  previewDeposit: (amount: bigint) => Promise<bigint>
  previewRedeem: (shares: bigint) => Promise<bigint>
  deposit: (amount: bigint) => Promise<void>
  redeem: (shares: bigint, receiver: string, owner: string) => Promise<void>
  fetchVaultData: () => Promise<void>
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export const useVault = () => {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault doit être utilisé dans un VaultProvider')
  return ctx
}

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [totalAssets, setTotalAssets] = useState<bigint | null>(null)
  const [userShares, setUserShares] = useState<bigint | null>(null)
  const [decimals, setDecimals] = useState<number | null>(null)
  const [assetDecimals, setAssetDecimals] = useState<number | null>(null) // Ajout

  // Récupère toutes les infos du contrat
  const fetchVaultData = useCallback(async () => {
    try {
      // Récupérer d'abord l'adresse du token sous-jacent
      const assetAddress = (await readContract(wagmiConfig, {
        abi: [
          {
            inputs: [],
            name: 'asset',
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: vaultAddress as `0x${string}`,
        functionName: 'asset',
      })) as `0x${string}`

      const [assets, shares, dec, assetDec] = await Promise.all([
        readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'totalAssets',
        }) as Promise<bigint>,
        address
          ? (readContract(wagmiConfig, {
              abi: vaultAbi,
              address: vaultAddress as `0x${string}`,
              functionName: 'balanceOf',
              args: [address],
            }) as Promise<bigint>)
          : Promise.resolve(null),
        readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'decimals',
        }) as Promise<number>,
        // Récupérer les décimales du token sous-jacent
        readContract(wagmiConfig, {
          abi: [
            {
              inputs: [],
              name: 'decimals',
              outputs: [{ name: '', type: 'uint8' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: assetAddress,
          functionName: 'decimals',
        }) as Promise<number>,
      ])
      setTotalAssets(assets)
      setUserShares(shares)
      setDecimals(dec)
      setAssetDecimals(assetDec)
    } catch (err) {
      console.error('Erreur lors de la récupération des données du Vault:', err)
      setTotalAssets(null)
      setUserShares(null)
      setDecimals(null)
      setAssetDecimals(null)
    }
  }, [address])

  // Rafraîchit à la connexion
  useEffect(() => {
    if (isConnected) {
      fetchVaultData()
    }
  }, [isConnected, address, fetchVaultData])

  // previewDeposit
  const previewDeposit = useCallback(async (amount: bigint) => {
    try {
      const result = await readContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'previewDeposit',
        args: [amount],
      })
      return result as bigint
    } catch (err) {
      throw new Error('Erreur lors du previewDeposit')
    }
  }, [])

  // previewRedeem
  const previewRedeem = useCallback(async (shares: bigint) => {
    try {
      const result = await readContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'previewRedeem',
        args: [shares],
      })
      return result as bigint
    } catch (err) {
      throw new Error('Erreur lors du previewRedeem')
    }
  }, [])

  // deposit
  const deposit = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error('Wallet non connecté')
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'deposit',
        args: [amount, address],
      })
      await waitForTransactionReceipt(wagmiConfig, { hash })
      await fetchVaultData()
    },
    [address, fetchVaultData, chainId]
  )

  // redeem
  const redeem = useCallback(
    async (shares: bigint, receiver: string, owner: string) => {
      if (!address) throw new Error('Wallet non connecté')
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'redeem',
        args: [shares, receiver, owner],
      })
      await waitForTransactionReceipt(wagmiConfig, { hash })
      await fetchVaultData()
    },
    [address, fetchVaultData, chainId]
  )

  const value: VaultContextType = {
    totalAssets,
    userShares,
    decimals,
    assetDecimals, // Ajout
    previewDeposit,
    previewRedeem,
    deposit,
    redeem,
    fetchVaultData,
  }

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}
