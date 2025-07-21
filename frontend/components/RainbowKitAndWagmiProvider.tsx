'use client'

import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import { rabbyWallet } from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider } from 'wagmi'
import { hardhat, sepolia, mainnet } from 'wagmi/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

// Sélection dynamique de la chaîne selon l'env
const chainEnv = process.env.NEXT_PUBLIC_CHAIN_ENV || 'sepolia'

const chainsByEnv = {
  localhost: [hardhat] as const,
  sepolia: [sepolia] as const,
  Mainnet: [mainnet] as const,
}

const activeChains =
  chainsByEnv[chainEnv as keyof typeof chainsByEnv] || chainsByEnv.localhost

// Configuration wagmi + RainbowKit centralisée
const config = getDefaultConfig({
  appName: 'Kinoshi',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '80a20fd75ed562869992eb8b7ae5161d',
  chains: activeChains,
  ssr: true, // Support SSR pour Next.js
  wallets: [
    {
      groupName: 'Recommandés',
      wallets: [
        rabbyWallet,
        // Les autres portefeuilles par défaut sont automatiquement inclus
      ],
    },
  ],
})

const queryClient = new QueryClient()

// Thème Kinoshi
const kinoshiTheme = lightTheme({
  accentColor: '#61A291',
  accentColorForeground: 'white',
  borderRadius: 'small',
  fontStack: 'system',
  overlayBlur: 'small',
})

const RainbowKitAndWagmiProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={kinoshiTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default RainbowKitAndWagmiProvider
export { config as wagmiConfig }
