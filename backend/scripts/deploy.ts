import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer, treasury] = await ethers.getSigners();
  console.log("🚀 Déploiement Kinoshi avec le compte:", deployer.address);
  console.log(
    "💰 Balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 1. Déploiement des tokens mockés
  console.log("\n📦 Déploiement des tokens mockés...");

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
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

  await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 6);
  await tokenRegistry.registerToken(await mockGold.getAddress(), "mGOLD", 18);
  await tokenRegistry.registerToken(await mockBTC.getAddress(), "mBTC", 8);
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

  // 5. Configuration des prix réalistes
  console.log("\n💰 Configuration des prix réalistes...");

  // Prix en USDC (normalisés en base 18)
  const btcPrice = parseUnits("118800", 18); // 118,800 USD
  const equityPrice = parseUnits("623.62", 18); // 623.62 USD
  const goldPrice = parseUnits("3355", 18); // 3,355 USD
  const bondPrice = parseUnits("95.78", 18); // 95.78 USD
  const usdcPrice = parseUnits("1", 18); // 1 USDC = 1 USDC

  await mockPriceFeed.setPrice(await mockBTC.getAddress(), btcPrice, 18);
  await mockPriceFeed.setPrice(await mockEquity.getAddress(), equityPrice, 18);
  await mockPriceFeed.setPrice(await mockGold.getAddress(), goldPrice, 18);
  await mockPriceFeed.setPrice(await mockBonds.getAddress(), bondPrice, 18);
  await mockPriceFeed.setPrice(await mockUSDC.getAddress(), usdcPrice, 18);

  console.log("✅ Prix configurés:");
  console.log("  - BTC: $118,800");
  console.log("  - Equity: $623.62");
  console.log("  - Gold: $3,355");
  console.log("  - Bonds: $95.78");
  console.log("  - USDC: $1.00");

  // 6. Déploiement du Vault avec Oracle
  console.log("\n🏦 Déploiement du Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    await mockUSDC.getAddress(), // token sous-jacent
    "Équilibrée", // label de la stratégie
    deployer.address, // treasury (utilise le deployer comme treasury pour les tests)
    await tokenRegistry.getAddress(), // TokenRegistry
    await mockPriceFeed.getAddress() // Oracle
  );
  await vault.waitForDeployment();
  console.log("✅ Vault déployé à:", await vault.getAddress());
  console.log("   Treasury:", treasury.address);

  // 7. Configuration de la stratégie équilibrée
  console.log("\n⚖️ Configuration de la stratégie équilibrée...");

  const strategyAllocations = [
    {
      token: await mockGold.getAddress(),
      weight: parseUnits("0.20", 18),
      active: true,
    },
    {
      token: await mockBTC.getAddress(),
      weight: parseUnits("0.15", 18),
      active: true,
    },
    {
      token: await mockBonds.getAddress(),
      weight: parseUnits("0.35", 18),
      active: true,
    },
    {
      token: await mockEquity.getAddress(),
      weight: parseUnits("0.30", 18),
      active: true,
    },
  ];

  await vault.setAllocations(strategyAllocations);
  console.log("✅ Stratégie 'Équilibrée' configurée");

  // 8. Configuration des frais
  console.log("\n💰 Configuration des frais...");

  // Définir les frais de sortie à 0.5% (50 basis points)
  await vault.setFees(50, 0);
  console.log("✅ Frais de sortie configurés à 0.5%");

  // Définir le fee receiver (utilise le deployer pour les tests)
  await vault.setFeeReceiver(deployer.address);
  console.log("✅ Fee receiver configuré");

  // 9. Mint de tokens pour le déploiement
  console.log("\n💰 Mint de tokens pour le déploiement...");

  const mintAmount = parseUnits("1000000", 6); // 1M USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("✅ 1M MockUSDC mintés pour le déploiement");

  // 10. Bootstrap du Vault
  console.log("\n🚀 Bootstrap du Vault...");

  // Approbation pour le bootstrap
  const bootstrapAmount = parseUnits("200", 6); // 200 USDC
  await mockUSDC.approve(await vault.getAddress(), bootstrapAmount);

  await vault.bootstrapVault();
  console.log("✅ Vault bootstrappé avec 200 USDC");

  // 11. Affichage des adresses finales
  console.log("\n🎯 Adresses des contrats déployés:");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("MockGold:", await mockGold.getAddress());
  console.log("MockBTC:", await mockBTC.getAddress());
  console.log("MockBonds:", await mockBonds.getAddress());
  console.log("MockEquity:", await mockEquity.getAddress());
  console.log("TokenRegistry:", await tokenRegistry.getAddress());
  console.log("MockPriceFeed:", await mockPriceFeed.getAddress());
  console.log("Vault:", await vault.getAddress());
  console.log("Treasury:", treasury.address);

  console.log("\n✨ Déploiement terminé avec succès!");
  console.log(
    "📝 N'oubliez pas de mettre à jour constants/index.ts avec ces adresses"
  );
  // 12. Génération automatique du fichier constants pour le frontend
  console.log("\n🛠️ Génération du fichier frontend/constants/index.ts...");

  const frontendConstantsPath = join(
    __dirname,
    "../../frontend/constants/index.ts"
  );
  const constantsContent = `// constants/index.ts

  // 🔐 Adresses des contrats déployés localement (Hardhat)
  // 💡 Généré automatiquement par le script de déploiement
  // 📝 Ne pas utiliser en prod/testnet sans adaptation

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
  `;

  try {
    writeFileSync(frontendConstantsPath, constantsContent, "utf-8");
    console.log(
      "✅ Fichier frontend/constants/index.ts mis à jour automatiquement"
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour du fichier constants:",
      error
    );
    console.log("📌 Copie manuelle à envisager si le chemin est incorrect.");
  }
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement:", error);
  process.exitCode = 1;
});
