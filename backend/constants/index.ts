// Adresses des contrats déployés
// Ces adresses seront mises à jour après le déploiement

export const CONTRACT_ADDRESSES = {
  // Local development (Hardhat)
  localhost: {
    MOCK_USDC: "0x0000000000000000000000000000000000000000", // À remplir après déploiement
    MOCK_GOLD: "0x0000000000000000000000000000000000000000",
    MOCK_BTC: "0x0000000000000000000000000000000000000000",
    MOCK_BONDS: "0x0000000000000000000000000000000000000000",
    MOCK_EQUITY: "0x0000000000000000000000000000000000000000",
    TOKEN_REGISTRY: "0x0000000000000000000000000000000000000000",
    VAULT: "0x0000000000000000000000000000000000000000",
  },

  // Sepolia testnet
  sepolia: {
    MOCK_USDC: "0x0000000000000000000000000000000000000000", // À remplir après déploiement
    MOCK_GOLD: "0x0000000000000000000000000000000000000000",
    MOCK_BTC: "0x0000000000000000000000000000000000000000",
    MOCK_BONDS: "0x0000000000000000000000000000000000000000",
    MOCK_EQUITY: "0x0000000000000000000000000000000000000000",
    TOKEN_REGISTRY: "0x0000000000000000000000000000000000000000",
    VAULT: "0x0000000000000000000000000000000000000000",
  },
};

// Configuration des stratégies
export const STRATEGY_CONFIG = {
  EQUILIBREE: {
    id: "equilibree",
    name: "Stratégie Équilibrée",
    description: "Allocation équilibrée entre les différents actifs",
    allocations: [
      { token: "MOCK_USDC", weight: 0.25 }, // 25%
      { token: "MOCK_GOLD", weight: 0.25 }, // 25%
      { token: "MOCK_BTC", weight: 0.25 }, // 25%
      { token: "MOCK_BONDS", weight: 0.15 }, // 15%
      { token: "MOCK_EQUITY", weight: 0.1 }, // 10%
    ],
  },
};

// Configuration des frais (en basis points)
export const FEE_CONFIG = {
  EXIT_FEE_BPS: 50, // 0.5%
  MANAGEMENT_FEE_BPS: 100, // 1%
  MAX_FEE_BPS: 1000, // 10%
  MAX_SLIPPAGE_BPS: 500, // 5%
};

// Configuration des décimales
export const DECIMALS_CONFIG = {
  USDC: 6,
  BTC: 8,
  GOLD: 18,
  BONDS: 18,
  EQUITY: 18,
  VAULT_SHARES: 18,
};
