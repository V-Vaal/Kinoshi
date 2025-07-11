import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
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

  // 4. Déploiement du Vault avec les 3 arguments requis
  console.log("\n🏦 Déploiement du Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    await mockUSDC.getAddress(), // token sous-jacent
    "Équilibrée", // label de la stratégie
    deployer.address // treasury (utilise le deployer comme treasury pour les tests)
  );
  await vault.waitForDeployment();
  console.log("✅ Vault déployé à:", await vault.getAddress());

  // 5. Configuration de la stratégie équilibrée
  console.log("\n⚖️ Configuration de la stratégie équilibrée...");

  const strategyAllocations = [
    {
      token: await mockUSDC.getAddress(),
      weight: parseUnits("0.25", 18), // 25%
      active: true,
    },
    {
      token: await mockGold.getAddress(),
      weight: parseUnits("0.25", 18), // 25%
      active: true,
    },
    {
      token: await mockBTC.getAddress(),
      weight: parseUnits("0.25", 18), // 25%
      active: true,
    },
    {
      token: await mockBonds.getAddress(),
      weight: parseUnits("0.15", 18), // 15%
      active: true,
    },
    {
      token: await mockEquity.getAddress(),
      weight: parseUnits("0.10", 18), // 10%
      active: true,
    },
  ];

  await vault.setAllocations(strategyAllocations);
  console.log("✅ Stratégie 'Équilibrée' configurée");

  // 6. Configuration des frais
  console.log("\n💰 Configuration des frais...");

  // Définir les frais de sortie à 0.5% (50 basis points)
  await vault.setExitFeeBps(50);
  console.log("✅ Frais de sortie configurés à 0.5%");

  // Définir le fee receiver (utilise le deployer pour les tests)
  await vault.setFeeReceiver(deployer.address);
  console.log("✅ Fee receiver configuré");

  // 7. Mint de tokens pour le déploiement
  console.log("\n💰 Mint de tokens pour le déploiement...");

  const mintAmount = parseUnits("1000000", 6); // 1M USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("✅ 1M MockUSDC mintés pour le déploiement");

  // 8. Bootstrap du Vault
  console.log("\n🚀 Bootstrap du Vault...");
  await vault.bootstrapVault();
  console.log("✅ Vault bootstrappé avec 1 USDC");

  // 9. Affichage des adresses finales
  console.log("\n🎯 Adresses des contrats déployés:");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("MockGold:", await mockGold.getAddress());
  console.log("MockBTC:", await mockBTC.getAddress());
  console.log("MockBonds:", await mockBonds.getAddress());
  console.log("MockEquity:", await mockEquity.getAddress());
  console.log("TokenRegistry:", await tokenRegistry.getAddress());
  console.log("Vault:", await vault.getAddress());

  console.log("\n✨ Déploiement terminé avec succès!");
  console.log(
    "📝 N'oubliez pas de mettre à jour constants/index.ts avec ces adresses"
  );
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement:", error);
  process.exitCode = 1;
});
