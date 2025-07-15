import React, { ReactNode } from 'react'
import { LangProvider } from './LangContext'
import { UIProvider } from './UIContext'
import { UserProvider } from './UserContext'
import { VaultProvider } from './VaultContext'
import { TokenRegistryProvider } from './TokenRegistryContext'

export const ContextProvider = ({ children }: { children: ReactNode }) => (
  <LangProvider>
    <UIProvider>
      <UserProvider>
        <VaultProvider>
          <TokenRegistryProvider>{children}</TokenRegistryProvider>
        </VaultProvider>
      </UserProvider>
    </UIProvider>
  </LangProvider>
)
