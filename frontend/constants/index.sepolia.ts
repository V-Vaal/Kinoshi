// Configuration réseau Sepolia
export const networkConfig = {
  chainId: 11155111,
  name: 'Sepolia',
  rpcUrl:
    process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA ||
    'RPC_URL_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/spa0bQSwKrxHU_Z1HR3AO',
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
