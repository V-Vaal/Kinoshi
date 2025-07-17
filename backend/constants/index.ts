// Adresses des contrats déployés
// Ces adresses seront mises à jour après le déploiement

export const CONTRACT_ADDRESSES = {
  // Local development (Hardhat)
  localhost: {
    MOCK_USDC: "0x74Cf9087AD26D541930BaC724B7ab21bA8F00a27", // À remplir après déploiement
    MOCK_GOLD: "0xefAB0Beb0A557E452b398035eA964948c750b2Fd",
    MOCK_BTC: "0xaca81583840B1bf2dDF6CDe824ada250C1936B4D",
    MOCK_BONDS: "0x70bDA08DBe07363968e9EE53d899dFE48560605B",
    MOCK_EQUITY: "0x26B862f640357268Bd2d9E95bc81553a2Aa81D7E",
    TOKEN_REGISTRY: "0xA56F946D6398Dd7d9D4D9B337Cf9E0F68982ca5B",
    VAULT: "0x5133BBdfCCa3Eb4F739D599ee4eC45cBCD0E16c5",
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
      { token: "MOCK_GOLD", weight: 0.2 }, // 20%
      { token: "MOCK_BTC", weight: 0.15 }, // 15%
      { token: "MOCK_BONDS", weight: 0.35 }, // 35%
      { token: "MOCK_EQUITY", weight: 0.3 }, // 30%
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
