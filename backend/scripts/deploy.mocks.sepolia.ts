import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Déploiement des mocks avec le compte:", deployer.address);

  // Déploiement des tokens mocks
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();
  const MockGold = await ethers.getContractFactory("MockGold");
  const mockGold = await MockGold.deploy();
  await mockGold.waitForDeployment();
  const MockBTC = await ethers.getContractFactory("MockBTC");
  const mockBTC = await MockBTC.deploy();
  await mockBTC.waitForDeployment();
  const MockBonds = await ethers.getContractFactory("MockBonds");
  const mockBonds = await MockBonds.deploy();
  await mockBonds.waitForDeployment();
  const MockEquity = await ethers.getContractFactory("MockEquity");
  const mockEquity = await MockEquity.deploy();
  await mockEquity.waitForDeployment();

  // Déploiement du TokenRegistry
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  await tokenRegistry.waitForDeployment();

  // Enregistrement des tokens dans le registry
  await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 18);
  await tokenRegistry.registerToken(await mockGold.getAddress(), "mGOLD", 18);
  await tokenRegistry.registerToken(await mockBTC.getAddress(), "mBTC", 18);
  await tokenRegistry.registerToken(await mockBonds.getAddress(), "mBONDS", 18);
  await tokenRegistry.registerToken(await mockEquity.getAddress(), "mEQUITY", 18);

  // Déploiement du MockPriceFeed
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const mockPriceFeed = await MockPriceFeed.deploy(deployer.address);
  await mockPriceFeed.waitForDeployment();

  // Configuration des prix (1 pour tous, base 18)
  const price = parseUnits("1", 18);
  await mockPriceFeed.setPrice(await mockBTC.getAddress(), price, 18);
  await mockPriceFeed.setPrice(await mockEquity.getAddress(), price, 18);
  await mockPriceFeed.setPrice(await mockGold.getAddress(), price, 18);
  await mockPriceFeed.setPrice(await mockBonds.getAddress(), price, 18);
  await mockPriceFeed.setPrice(await mockUSDC.getAddress(), price, 18);

  // Génération du fichier de constantes pour le frontend
  const frontendConstantsPath = join(
    __dirname,
    "../../frontend/constants/mocks.sepolia.ts"
  );
  const constantsContent = `// mocks.sepolia.ts\n\nexport const mockTokenAddresses = {\n  mUSDC: "${await mockUSDC.getAddress()}",\n  mGOLD: "${await mockGold.getAddress()}",\n  mBTC: "${await mockBTC.getAddress()}",\n  mBONDS: "${await mockBonds.getAddress()}",\n  mEQUITY: "${await mockEquity.getAddress()}"\n};\n\nexport const tokenRegistryAddress = "${await tokenRegistry.getAddress()}";\nexport const mockOracleAddress = "${await mockPriceFeed.getAddress()}";\n`;
  writeFileSync(frontendConstantsPath, constantsContent, "utf-8");
  console.log("✅ Fichier frontend/constants/mocks.sepolia.ts généré");
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement des mocks:", error);
  process.exitCode = 1;
}); 