'use client'

import React, { ReactNode } from 'react'
import { LangProvider } from './LangContext'
import { UIProvider } from './UIContext'
import { UserProvider } from './UserContext'
import { VaultProvider } from './VaultContext'
import { TokenRegistryProvider } from './TokenRegistryContext'
import { RWAProvider } from './RWAContext'

export const ContextProvider = ({ children }: { children: ReactNode }) => (
  <LangProvider>
    <UIProvider>
      <UserProvider>
        <VaultProvider>
          <TokenRegistryProvider>
            <RWAProvider>{children}</RWAProvider>
          </TokenRegistryProvider>
        </VaultProvider>
      </UserProvider>
    </UIProvider>
  </LangProvider>
)
