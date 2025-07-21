// lib/config.ts

/**
 * Configuration principale de l'application Kinoshi
 *
 * Ce fichier centralise toute la configuration de l'application
 * en utilisant les variables d'environnement du fichier .env racine.
 */

// Configuration réseau
export const networkConfig = {
  chainId: 11155111, // Sepolia
  name: 'Sepolia',
  rpcUrl:
    process.env.RPC_URL_SEPOLIA || process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA,
  explorer: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
}

// Configuration de l'application
export const appConfig = {
  name: 'Kinoshi',
  description: 'Gestionnaire de portefeuille sur Sepolia',
  url: 'https://kinoshi.app',
  environment: process.env.NEXT_PUBLIC_CHAIN_ENV || 'sepolia',
}

// Configuration WalletConnect
export const walletConnectConfig = {
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  metadata: {
    name: appConfig.name,
    description: appConfig.description,
    url: appConfig.url,
    icons: [`${appConfig.url}/icon.png`],
  },
}

// Configuration des contrats (sera mise à jour après déploiement)
export const contractConfig = {
  vault:
    process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
    '0x0000000000000000000000000000000000000000',
  tokenRegistry:
    process.env.NEXT_PUBLIC_TOKEN_REGISTRY_ADDRESS ||
    '0x0000000000000000000000000000000000000000',
  mockOracle:
    process.env.NEXT_PUBLIC_MOCK_ORACLE_ADDRESS ||
    '0x0000000000000000000000000000000000000000',
  mockTokens: {
    USDC:
      process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    GOLD:
      process.env.NEXT_PUBLIC_MOCK_GOLD_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    BTC:
      process.env.NEXT_PUBLIC_MOCK_BTC_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    BONDS:
      process.env.NEXT_PUBLIC_MOCK_BONDS_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
    EQUITY:
      process.env.NEXT_PUBLIC_MOCK_EQUITY_ADDRESS ||
      '0x0000000000000000000000000000000000000000',
  },
}

// Configuration des prix pour Sepolia (en USDC)
export const priceConfig = {
  BTC: 45000, // $45,000
  GOLD: 2000, // $2,000
  EQUITY: 150, // $150
  BONDS: 100, // $100
  USDC: 1, // $1.00
}

// Configuration de la stratégie d'allocation pour Sepolia
export const allocationConfig = {
  GOLD: 0.25, // 25%
  BTC: 0.2, // 20%
  BONDS: 0.3, // 30%
  EQUITY: 0.25, // 25%
}

// Configuration des frais pour Sepolia
export const feeConfig = {
  exitFee: 0.005, // 0.5%
  managementFee: 0, // 0%
}

// Fonctions utilitaires
export const isSepolia = (chainId?: number) => {
  return chainId === networkConfig.chainId
}

export const getExplorerUrl = (
  address: string,
  type: 'address' | 'tx' = 'address'
) => {
  return `${networkConfig.explorer}/${type}/${address}`
}

export const formatAddress = (address: string) => {
  if (!address) return 'Non connecté'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Validation de la configuration
export const validateConfig = () => {
  const errors: string[] = []

  if (!networkConfig.rpcUrl) {
    errors.push('RPC_URL_SEPOLIA non configuré')
  }

  if (
    !walletConnectConfig.projectId ||
    walletConnectConfig.projectId === 'your-project-id'
  ) {
    errors.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID non configuré')
  }

  if (errors.length > 0) {
    console.warn('⚠️ Configuration incomplète:', errors)
    return false
  }

  return true
}

// Export de la configuration complète
export const config = {
  network: networkConfig,
  app: appConfig,
  walletConnect: walletConnectConfig,
  contracts: contractConfig,
  prices: priceConfig,
  allocation: allocationConfig,
  fees: feeConfig,
  utils: {
    isSepolia,
    getExplorerUrl,
    formatAddress,
    validateConfig,
  },
}
