'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useAccount } from 'wagmi'
import { useVaultRoles } from '@/utils/useVaultRoles'

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

  // Utiliser le hook useVaultRoles pour récupérer les rôles
  const { isAdmin, loading: loadingRole } = useVaultRoles()

  // Un utilisateur connecté est considéré comme "user" (pas de whitelist)
  const isVisitor = !isConnected
  const isUser = isConnected // Tout utilisateur connecté est un "user"
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
