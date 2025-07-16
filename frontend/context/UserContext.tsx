'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import type { Abi } from 'viem'

export type Strategie = 'equilibree' | 'sure' | 'dynamique'

export interface UserContextType {
  address: string | null
  strategie: Strategie
  setStrategie: (s: Strategie) => void
  montantInvesti: number
  setMontantInvesti: (n: number) => void
  isConnected: boolean
  setIsConnected: (b: boolean) => void
  isAdmin: boolean
  isUser: boolean
  isVisitor: boolean
  isAuthorized: () => boolean
  loadingRole: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount()
  const [strategie, setStrategie] = useState<Strategie>('equilibree')
  const [montantInvesti, setMontantInvesti] = useState<number>(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isUser, setIsUser] = useState(false)
  const [loadingRole, setLoadingRole] = useState(false)

  useEffect(() => {
    const fetchRole = async () => {
      if (!address || !isConnected) {
        setIsAdmin(false)
        setIsUser(false)
        setLoadingRole(false)
        return
      }
      setLoadingRole(true)
      try {
        const abi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi
        const admin = await readContract(wagmiConfig, {
          abi,
          address: vaultAddress as `0x${string}`,
          functionName: 'isAdmin',
          args: [address],
        })
        const whitelisted = await readContract(wagmiConfig, {
          abi,
          address: vaultAddress as `0x${string}`,
          functionName: 'isWhitelisted',
          args: [address],
        })
        setIsAdmin(Boolean(admin))
        setIsUser(Boolean(whitelisted))
      } catch (e) {
        setIsAdmin(false)
        setIsUser(false)
      } finally {
        setLoadingRole(false)
      }
    }
    fetchRole()
  }, [address, isConnected])

  // Un utilisateur connecté est considéré comme "user" même s'il n'est pas whitelisté
  // isWhitelisted est conservé comme information technique uniquement
  const isVisitor = !isConnected
  const isAuthorized = () => isConnected

  return (
    <UserContext.Provider
      value={{
        address: address ?? null,
        strategie,
        setStrategie,
        montantInvesti,
        setMontantInvesti,
        isConnected,
        setIsConnected: () => {}, // à adapter si besoin
        isAdmin,
        isUser,
        isVisitor,
        isAuthorized,
        loadingRole,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser doit être utilisé dans un UserProvider')
  return ctx
}
