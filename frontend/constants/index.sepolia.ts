// constants/index.sepolia.ts

// 🔐 Adresses des contrats déployés sur Sepolia
// 💡 Généré automatiquement par le script de déploiement Sepolia
// 📝 Configuration spécifique au réseau de test Sepolia
// ⚠️  REMPLACER PAR LES VRAIES ADRESSES APRÈS DÉPLOIEMENT

export const vaultAddress = '0x0000000000000000000000000000000000000000' // À remplacer
export const tokenRegistryAddress = '0x0000000000000000000000000000000000000000' // À remplacer

export const mockTokenAddresses = {
  mUSDC: '0x0000000000000000000000000000000000000000', // À remplacer
  mGOLD: '0x0000000000000000000000000000000000000000', // À remplacer
  mBTC: '0x0000000000000000000000000000000000000000', // À remplacer
  mBONDS: '0x0000000000000000000000000000000000000000', // À remplacer
  mEQUITY: '0x0000000000000000000000000000000000000000', // À remplacer
}

export const mockOracleAddress = '0x0000000000000000000000000000000000000000' // À remplacer

// Configuration réseau Sepolia
export const networkConfig = {
  chainId: 11155111,
  name: 'Sepolia',
  rpcUrl:
    process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA ||
    'https://sepolia.infura.io/v3/your-project-id',
  explorer: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
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
