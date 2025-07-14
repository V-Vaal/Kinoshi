// wagmi.config.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat, Chain } from 'wagmi/chains'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'

// Sélection dynamique de la chaîne selon l'env
const chainEnv = process.env.NEXT_PUBLIC_CHAIN_ENV || 'localhost'

const chainsByEnv: Record<string, Chain> = {
  localhost: hardhat,
  sepolia,
  mainnet,
}

const rpcByEnv: Record<string, string> = {
  localhost: process.env.RPC_URL_LOCALHOST || 'http://127.0.0.1:8545',
  sepolia: process.env.RPC_URL_SEPOLIA || '',
  mainnet: process.env.RPC_URL_MAINNET || '',
}

// Chaîne et transport actifs
const activeChain = chainsByEnv[chainEnv] || hardhat
const rpcUrl = rpcByEnv[chainEnv] || rpcByEnv.localhost

// WalletConnect + MetaMask...
const { connectors } = getDefaultWallets({
  appName: 'Kinoshi',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
})

// Config wagmi
export const wagmiConfig = createConfig({
  connectors,
  chains: [activeChain],
  transports: {
    [activeChain.id]: http(rpcUrl),
  },
})

export const chains = [activeChain]
export { activeChain }
