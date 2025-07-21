import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * Script de déploiement Sepolia pour l'écosystème Kinoshi
 *
 * Ce script déploie et configure tous les contrats sur le réseau de test Sepolia :
 * 1. Tokens mockés (USDC, Gold, BTC, Bonds, Equity)
 * 2. TokenRegistry pour la gestion des tokens autorisés
 * 3. MockPriceFeed pour les prix des actifs
 * 4. Vault principal avec stratégie d'allocation
 *
 * PRÉREQUIS :
 * - Variables d'environnement configurées dans .env :
 *   - RPC_URL_SEPOLIA : URL RPC du réseau Sepolia
 *   - PRIVATE_KEY : Clé privée du compte de déploiement
 *   - ETHERSCAN_API_KEY : Clé API Etherscan pour la vérification
 *
 * - Compte de déploiement avec suffisamment d'ETH pour le gas
 *
 * Le script configure également :
 * - Les allocations d'actifs (stratégie équilibrée)
 * - Les frais de sortie et de gestion
 * - Les prix réalistes pour les tests
 * - Le bootstrap du vault
 *
 * À la fin, il génère automatiquement le fichier constants/index.ts
 * pour le frontend avec toutes les adresses déployées.
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "🚀 Déploiement Kinoshi sur Sepolia avec le compte:",
    deployer.address
  );
  console.log(
    "💰 Balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Vérification de la configuration réseau
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error(
      "Ce script doit être exécuté sur le réseau Sepolia (chainId: 11155111)"
    );
  }

  // 1. Déploiement des tokens mockés
  console.log("\n📦 Déploiement des tokens mockés...");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();
  console.log("✅ MockUSDC déployé à:", await mockUSDC.getAddress());

  const MockGold = await ethers.getContractFactory("MockGold");
  const mockGold = await MockGold.deploy();
  await mockGold.waitForDeployment();
  console.log("✅ MockGold déployé à:", await mockGold.getAddress());

  const MockBTC = await ethers.getContractFactory("MockBTC");
  const mockBTC = await MockBTC.deploy();
  await mockBTC.waitForDeployment();
  console.log("✅ MockBTC déployé à:", await mockBTC.getAddress());

  const MockBonds = await ethers.getContractFactory("MockBonds");
  const mockBonds = await MockBonds.deploy();
  await mockBonds.waitForDeployment();
  console.log("✅ MockBonds déployé à:", await mockBonds.getAddress());

  const MockEquity = await ethers.getContractFactory("MockEquity");
  const mockEquity = await MockEquity.deploy();
  await mockEquity.waitForDeployment();
  console.log("✅ MockEquity déployé à:", await mockEquity.getAddress());

  // 2. Déploiement du TokenRegistry
  console.log("\n📋 Déploiement du TokenRegistry...");
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  await tokenRegistry.waitForDeployment();
  console.log("✅ TokenRegistry déployé à:", await tokenRegistry.getAddress());

  // 3. Enregistrement des tokens dans le registry
  console.log("\n🔗 Enregistrement des tokens dans le registry...");

  await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 18);
  await tokenRegistry.registerToken(await mockGold.getAddress(), "mGOLD", 18);
  await tokenRegistry.registerToken(await mockBTC.getAddress(), "mBTC", 18);
  await tokenRegistry.registerToken(await mockBonds.getAddress(), "mBONDS", 18);
  await tokenRegistry.registerToken(
    await mockEquity.getAddress(),
    "mEQUITY",
    18
  );
  console.log("✅ Tous les tokens enregistrés dans le registry");

  // 4. Déploiement du MockPriceFeed
  console.log("\n📊 Déploiement du MockPriceFeed...");
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const mockPriceFeed = await MockPriceFeed.deploy(deployer.address);
  await mockPriceFeed.waitForDeployment();
  console.log("✅ MockPriceFeed déployé à:", await mockPriceFeed.getAddress());

  // 5. Configuration des prix réalistes pour Sepolia
  console.log("\n💰 Configuration des prix réalistes pour Sepolia...");

  // Prix en USDC (normalisés en base 18) - Prix réalistes pour Sepolia
  const btcPrice = parseUnits("45000", 18); // BTC à 45,000 USDC
  const equityPrice = parseUnits("150", 18); // Equity à 150 USDC
  const goldPrice = parseUnits("2000", 18); // Gold à 2,000 USDC
  const bondPrice = parseUnits("100", 18); // Bonds à 100 USDC
  const usdcPrice = parseUnits("1", 18); // USDC à 1 USDC

  await mockPriceFeed.setPrice(await mockBTC.getAddress(), btcPrice, 18);
  await mockPriceFeed.setPrice(await mockEquity.getAddress(), equityPrice, 18);
  await mockPriceFeed.setPrice(await mockGold.getAddress(), goldPrice, 18);
  await mockPriceFeed.setPrice(await mockBonds.getAddress(), bondPrice, 18);
  await mockPriceFeed.setPrice(await mockUSDC.getAddress(), usdcPrice, 18);

  console.log("✅ Prix configurés pour Sepolia:");
  console.log("  - BTC: $45,000");
  console.log("  - Equity: $150");
  console.log("  - Gold: $2,000");
  console.log("  - Bonds: $100");
  console.log("  - USDC: $1.00");

  // 6. Déploiement du Vault avec Oracle
  console.log("\n🏦 Déploiement du Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    await mockUSDC.getAddress(), // token sous-jacent
    "Équilibrée Sepolia", // label de la stratégie
    deployer.address, // treasury (utilise le deployer comme treasury pour Sepolia)
    await tokenRegistry.getAddress(), // TokenRegistry
    await mockPriceFeed.getAddress() // Oracle
  );
  await vault.waitForDeployment();
  console.log("✅ Vault déployé à:", await vault.getAddress());
  console.log("   Treasury:", deployer.address);

  // 7. Configuration de la stratégie équilibrée pour Sepolia
  console.log("\n⚖️ Configuration de la stratégie équilibrée pour Sepolia...");

  const strategyAllocations = [
    {
      token: await mockGold.getAddress(),
      weight: parseUnits("0.25", 18), // 25% Or
      active: true,
    },
    {
      token: await mockBTC.getAddress(),
      weight: parseUnits("0.20", 18), // 20% Bitcoin
      active: true,
    },
    {
      token: await mockBonds.getAddress(),
      weight: parseUnits("0.30", 18), // 30% Obligations
      active: true,
    },
    {
      token: await mockEquity.getAddress(),
      weight: parseUnits("0.25", 18), // 25% Actions
      active: true,
    },
  ];

  await vault.setAllocations(strategyAllocations);
  console.log("✅ Stratégie 'Équilibrée Sepolia' configurée");

  // 8. Configuration des frais pour Sepolia
  console.log("\n💰 Configuration des frais pour Sepolia...");

  // Définir les frais de sortie à 0.5% (50 basis points)
  await vault.setFees(50, 0);
  console.log("✅ Frais de sortie configurés à 0.5%");

  // Définir le fee receiver (utilise le deployer pour Sepolia)
  await vault.setFeeReceiver(deployer.address);
  console.log("✅ Fee receiver configuré");

  // 9. Mint de tokens pour le déploiement Sepolia
  console.log("\n💰 Mint de tokens pour le déploiement Sepolia...");

  const mintAmount = parseUnits("100000", 18); // 100K USDC pour Sepolia
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("✅ 100K MockUSDC mintés pour le déploiement Sepolia");

  // 10. Bootstrap du Vault
  console.log("\n🚀 Bootstrap du Vault...");

  // Approbation pour le bootstrap
  const bootstrapAmount = parseUnits("1", 18); // 1 USDC (standard ERC4626)
  await mockUSDC.approve(await vault.getAddress(), bootstrapAmount);

  await vault.bootstrapVault();
  console.log("✅ Vault bootstrappé avec 1 USDC");

  // 10 bis. Dépôt utilisateur post-bootstrap pour activer l'allocation RWA
  console.log("\n🧪 Dépôt utilisateur pour allocation RWA...");

  const depositAmount = parseUnits("1000", 18); // 1K USDC pour test allocation

  // Approve Vault pour transférer
  await mockUSDC.approve(await vault.getAddress(), depositAmount);

  // Effectue un vrai dépôt
  await vault.deposit(depositAmount, deployer.address);

  console.log(
    `✅ Dépôt de ${ethers.formatUnits(depositAmount, 18)} mUSDC effectué`
  );

  // 11. Affichage des adresses finales
  console.log("\n🎯 Adresses des contrats déployés sur Sepolia:");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("MockGold:", await mockGold.getAddress());
  console.log("MockBTC:", await mockBTC.getAddress());
  console.log("MockBonds:", await mockBonds.getAddress());
  console.log("MockEquity:", await mockEquity.getAddress());
  console.log("TokenRegistry:", await tokenRegistry.getAddress());
  console.log("MockPriceFeed:", await mockPriceFeed.getAddress());
  console.log("Vault:", await vault.getAddress());
  console.log("Treasury:", deployer.address);

  console.log("\n✨ Déploiement Sepolia terminé avec succès!");
  console.log("🔗 Explorer Sepolia: https://sepolia.etherscan.io/");

  // 11 bis. Vérification des assets du vault
  console.log("\n📊 Vérification des assets du vault...");

  const vaultUSDCBalance = await mockUSDC.balanceOf(await vault.getAddress());
  const totalAssets = await vault.totalAssets();
  console.log(
    `   - USDC dans le vault: ${ethers.formatUnits(vaultUSDCBalance, 18)} USDC`
  );
  console.log(`   - Total assets: ${ethers.formatUnits(totalAssets, 18)} USDC`);

  // 12. Génération automatique du fichier JSON de déploiement
  console.log("\n📄 Génération du fichier de déploiement...");

  const deploymentData = {
    vault: await vault.getAddress(),
    tokenRegistry: await tokenRegistry.getAddress(),
    mockPriceFeed: await mockPriceFeed.getAddress(),
    mockUSDC: await mockUSDC.getAddress(),
    mockGold: await mockGold.getAddress(),
    mockBTC: await mockBTC.getAddress(),
    mockBonds: await mockBonds.getAddress(),
    mockEquity: await mockEquity.getAddress(),
    treasury: deployer.address,
    deploymentDate: new Date().toISOString(),
    network: "sepolia",
    chainId: 11155111,
  };

  const deploymentPath = join(__dirname, "../deployment-sepolia.json");
  try {
    writeFileSync(
      deploymentPath,
      JSON.stringify(deploymentData, null, 2),
      "utf-8"
    );
    console.log("✅ Fichier deployment-sepolia.json généré");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la génération du fichier de déploiement:",
      error
    );
  }

  // 13. Génération automatique du fichier constants pour le frontend
  console.log(
    "\n🛠️ Génération du fichier frontend/constants/index.sepolia.ts..."
  );

  const frontendConstantsPath = join(
    __dirname,
    "../../frontend/constants/index.sepolia.ts"
  );
  const constantsContent = `// constants/index.sepolia.ts

// 🔐 Adresses des contrats déployés sur Sepolia
// 💡 Généré automatiquement par le script de déploiement Sepolia
// 📝 Configuration spécifique au réseau de test Sepolia

export const vaultAddress = "${await vault.getAddress()}";
export const tokenRegistryAddress = "${await tokenRegistry.getAddress()}";

export const mockTokenAddresses = {
  mUSDC: "${await mockUSDC.getAddress()}",
  mGOLD: "${await mockGold.getAddress()}",
  mBTC: "${await mockBTC.getAddress()}",
  mBONDS: "${await mockBonds.getAddress()}",
  mEQUITY: "${await mockEquity.getAddress()}"
};

export const mockOracleAddress = "${await mockPriceFeed.getAddress()}";

// Configuration réseau Sepolia
export const networkConfig = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || "https://sepolia.infura.io/v3/your-project-id",
  explorer: "https://sepolia.etherscan.io"
};

// Configuration des prix pour Sepolia (en USDC)
export const priceConfig = {
  BTC: 45000, // $45,000
  GOLD: 2000, // $2,000
  EQUITY: 150, // $150
  BONDS: 100, // $100
  USDC: 1 // $1.00
};

// Configuration de la stratégie d'allocation pour Sepolia
export const allocationConfig = {
  GOLD: 0.25, // 25%
  BTC: 0.20, // 20%
  BONDS: 0.30, // 30%
  EQUITY: 0.25 // 25%
};

// Configuration des frais pour Sepolia
export const feeConfig = {
  exitFee: 0.005, // 0.5%
  managementFee: 0 // 0%
};
`;

  try {
    writeFileSync(frontendConstantsPath, constantsContent, "utf-8");
    console.log(
      "✅ Fichier frontend/constants/index.sepolia.ts mis à jour automatiquement"
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour du fichier constants:",
      error
    );
    console.log("📌 Copie manuelle à envisager si le chemin est incorrect.");
  }

  // 13. Instructions pour la vérification des contrats
  console.log("\n🔍 Instructions pour la vérification des contrats:");
  console.log("1. Vérifiez les contrats sur Etherscan Sepolia:");
  console.log(
    `   - Vault: https://sepolia.etherscan.io/address/${await vault.getAddress()}`
  );
  console.log(
    `   - TokenRegistry: https://sepolia.etherscan.io/address/${await tokenRegistry.getAddress()}`
  );
  console.log(
    `   - MockPriceFeed: https://sepolia.etherscan.io/address/${await mockPriceFeed.getAddress()}`
  );

  console.log("\n2. Pour vérifier automatiquement, utilisez:");
  console.log(
    "   npx hardhat verify --network sepolia <ADRESSE_CONTRAT> [ARGS...]"
  );

  console.log("\n3. Exemple de vérification du Vault:");
  console.log(`   npx hardhat verify --network sepolia ${await vault.getAddress()} \\
     "${await mockUSDC.getAddress()}" \\
     "Équilibrée Sepolia" \\
     "${deployer.address}" \\
     "${await tokenRegistry.getAddress()}" \\
     "${await mockPriceFeed.getAddress()}"`);
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement Sepolia:", error);
  process.exitCode = 1;
});
