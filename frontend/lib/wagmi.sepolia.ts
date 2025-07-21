import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { networkConfig } from '../constants/index.sepolia'

/**
 * Configuration Wagmi pour le réseau Sepolia
 *
 * Cette configuration permet au frontend de se connecter au réseau de test Sepolia
 * et d'interagir avec les contrats déployés.
 *
 * Fonctionnalités :
 * - Support du réseau Sepolia (chainId: 11155111)
 * - Connexion via MetaMask et WalletConnect
 * - Configuration RPC personnalisée
 * - Support des variables d'environnement
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      process.env.RPC_URL_SEPOLIA ||
        process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA ||
        'https://sepolia.infura.io/v3/your-project-id'
    ),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
      metadata: {
        name: 'Kinoshi - Sepolia',
        description: 'Application de gestion de portefeuille sur Sepolia',
        url: 'https://kinoshi.app',
        icons: ['https://kinoshi.app/icon.png'],
      },
    }),
  ],
  ssr: true,
})

// Configuration des chaînes supportées
export const supportedChains = [sepolia]

// Configuration par défaut pour Sepolia
export const defaultChain = sepolia

// Fonction utilitaire pour vérifier si on est sur Sepolia
export const isSepolia = (chainId?: number) => {
  return chainId === sepolia.id
}

// Fonction utilitaire pour obtenir l'explorer URL
export const getExplorerUrl = (
  address: string,
  type: 'address' | 'tx' = 'address'
) => {
  return `${networkConfig.explorer}/${type}/${address}`
}
