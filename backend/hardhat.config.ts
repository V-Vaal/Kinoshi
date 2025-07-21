import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "solidity-coverage";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Configuration Hardhat pour le projet Kinoshi
 *
 * Ce fichier configure l'environnement de développement et de déploiement
 * pour les contrats intelligents du vault RWA.
 *
 * Réseaux supportés:
 * - hardhat: Réseau local pour les tests et le développement
 * - sepolia: Réseau de test Ethereum pour les déploiements de test
 *
 * Outils inclus:
 * - Solidity 0.8.28 avec optimisations
 * - TypeChain pour la génération de types TypeScript
 * - Coverage pour l'analyse de couverture de code
 * - Toolbox pour les tests et la vérification
 */
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // Réseau local Hardhat pour le développement et les tests
    hardhat: {
      chainId: 31337,
    },
    // Réseau de test Sepolia pour les déploiements de test
    sepolia: {
      url: process.env.RPC_URL_SEPOLIA || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  // Configuration TypeChain pour la génération de types TypeScript
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.RPC_URL_SEPOLIA || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

//port default config;
export default module.exports;
