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
import { formatUnits } from 'viem'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

// Types exposés par le contexte
export interface VaultContextType {
  totalAssets: bigint | null
  userShares: bigint | null
  totalSupply: bigint | null
  decimals: number | null
  assetDecimals: number | null
  previewDeposit: (amount: bigint) => Promise<bigint>
  previewRedeem: (shares: bigint) => Promise<bigint>
  deposit: (amount: bigint) => Promise<void>
  redeem: (shares: bigint, receiver: string, owner: string) => Promise<void>
  fetchVaultData: () => Promise<void>
  refreshUserData: () => Promise<void>
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
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null)
  const [decimals, setDecimals] = useState<number | null>(null)
  const [assetDecimals, setAssetDecimals] = useState<number | null>(null)

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

      const [assets, shares, dec, assetDec, supply] = await Promise.all([
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
          : Promise.resolve(0n),
        readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'decimals',
        }) as Promise<number>,
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
        readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
      ])

      setTotalAssets(assets)
      setUserShares(shares)
      setTotalSupply(supply)
      setDecimals(dec)
      setAssetDecimals(assetDec)
    } catch (err) {
      setTotalAssets(null)
      setUserShares(null)
      setTotalSupply(null)
      setDecimals(null)
      setAssetDecimals(null)
    }
  }, [address])

  // Fonction pour rafraîchir uniquement les données utilisateur
  const refreshUserData = useCallback(async () => {
    if (!address) return

    try {
      const [shares, assets, supply] = await Promise.all([
        readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'balanceOf',
          args: [address],
        }) as Promise<bigint>,
        readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'totalAssets',
        }) as Promise<bigint>,
        readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
      ])

      setUserShares(shares)
      setTotalAssets(assets)
      setTotalSupply(supply)
    } catch (err) {
      // Erreur silencieuse
    }
  }, [address])

  // Rafraîchit à la connexion
  useEffect(() => {
    if (isConnected && address) {
      fetchVaultData()
    }
  }, [isConnected, address, fetchVaultData])

  // Écouter les événements de refresh
  useEffect(() => {
    const handler = () => fetchVaultData()
    const userDataHandler = () => refreshUserData()

    window.addEventListener('vault-refresh', handler)
    window.addEventListener('user-data-refresh', userDataHandler)

    return () => {
      window.removeEventListener('vault-refresh', handler)
      window.removeEventListener('user-data-refresh', userDataHandler)
    }
  }, [fetchVaultData, refreshUserData])

  // previewDeposit
  const previewDeposit = async (amount: bigint) => {
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
  }

  // previewRedeem
  const previewRedeem = async (shares: bigint) => {
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
  }

  // deposit
  const deposit = async (amount: bigint) => {
    if (!address) throw new Error('Wallet non connecté')
    const hash = await writeContract(wagmiConfig, {
      abi: vaultAbi,
      address: vaultAddress as `0x${string}`,
      functionName: 'deposit',
      args: [amount, address],
    })
    await waitForTransactionReceipt(wagmiConfig, { hash })
    await refreshUserData()
  }

  // redeem
  const redeem = async (shares: bigint, receiver: string, owner: string) => {
    if (!address) throw new Error('Wallet non connecté')
    const hash = await writeContract(wagmiConfig, {
      abi: vaultAbi,
      address: vaultAddress as `0x${string}`,
      functionName: 'redeem',
      args: [shares, receiver, owner],
    })
    await waitForTransactionReceipt(wagmiConfig, { hash })
    await refreshUserData()
  }

  const value: VaultContextType = {
    totalAssets,
    userShares,
    totalSupply,
    decimals,
    assetDecimals,
    previewDeposit,
    previewRedeem,
    deposit,
    redeem,
    fetchVaultData,
    refreshUserData,
  }

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}
