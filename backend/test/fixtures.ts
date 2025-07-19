import { ethers } from "hardhat";
import { parseUnits } from "ethers";

export async function deployVaultFixture() {
  const [owner, user1, user2, treasury] = await ethers.getSigners();

  // Déploiement du TokenRegistry
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  await tokenRegistry.waitForDeployment();

  // Déploiement du MockUSDC (18 décimales - standardisé)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();

  // Mint pour les utilisateurs AVANT toute action (10 000 mUSDC chacun)
  await mockUSDC.mint(owner.address, parseUnits("10000", 18));
  await mockUSDC.mint(user1.address, parseUnits("10000", 18));
  await mockUSDC.mint(user2.address, parseUnits("10000", 18));

  // Enregistrement du MockUSDC dans le TokenRegistry
  await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 18);

  // Déploiement de RWA tokens mock
  const MockRWA1 = await ethers.getContractFactory("MockUSDC");
  const mockRWA1 = await MockRWA1.deploy("Mock RWA 1", "mRWA1");
  await mockRWA1.waitForDeployment();

  const MockRWA2 = await ethers.getContractFactory("MockUSDC");
  const mockRWA2 = await MockRWA2.deploy("Mock RWA 2", "mRWA2");
  await mockRWA2.waitForDeployment();

  // Enregistrement des RWA tokens
  await tokenRegistry.registerToken(await mockRWA1.getAddress(), "mRWA1", 18);
  await tokenRegistry.registerToken(await mockRWA2.getAddress(), "mRWA2", 18);

  // Déploiement du MockPriceFeed
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
  await mockPriceFeed.waitForDeployment();

  // Configuration des prix par défaut (en 18 décimales)
  const usdcPrice = parseUnits("1", 18); // 1 USDC = 1 USDC
  await mockPriceFeed.setPrice(await mockUSDC.getAddress(), usdcPrice, 18);

  // Configuration des prix des RWA tokens (en 18 décimales)
  const rwa1Price = parseUnits("1.2", 18); // 1 RWA1 = 1.2 USDC
  const rwa2Price = parseUnits("0.8", 18); // 1 RWA2 = 0.8 USDC
  await mockPriceFeed.setPrice(await mockRWA1.getAddress(), rwa1Price, 18);
  await mockPriceFeed.setPrice(await mockRWA2.getAddress(), rwa2Price, 18);

  // Déploiement du Vault avec TokenRegistry et Oracle
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    await mockUSDC.getAddress(),
    "Équilibrée",
    treasury.address,
    tokenRegistry.getAddress(),
    mockPriceFeed.getAddress()
  );
  await vault.waitForDeployment();

  // Définition d'une allocation 100% RWA1 (plus simple pour les tests)
  const allocations = [
    {
      token: await mockRWA1.getAddress(),
      weight: parseUnits("1", 18), // 100% sur RWA1
      active: true,
    },
  ];

  // Configuration de l'allocation (owner only)
  await vault.connect(owner).setAllocations(allocations);

  return {
    vault,
    mockUSDC,
    mockRWA1,
    mockRWA2,
    tokenRegistry,
    mockPriceFeed,
    owner,
    user1,
    user2,
    treasury,
    allocations,
  };
}
export async function deployVaultFixtureEmpty() {
  const [owner, user1, user2, treasury] = await ethers.getSigners();

  // Déploiement du TokenRegistry
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  await tokenRegistry.waitForDeployment();

  // Déploiement du MockUSDC (18 décimales - standardisé)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();

  // Mint 10 USDC au owner pour le bootstrap
  await mockUSDC.mint(owner.address, parseUnits("10", 18));

  // Enregistrement du MockUSDC dans le TokenRegistry
  await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 18);

  // Déploiement du MockPriceFeed
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
  await mockPriceFeed.waitForDeployment();

  // Configuration des prix par défaut (en 18 décimales)
  const usdcPrice = parseUnits("1", 18); // 1 USDC = 1 USDC
  await mockPriceFeed.setPrice(await mockUSDC.getAddress(), usdcPrice, 18);

  // Déploiement du Vault SANS ALLOCATION
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    await mockUSDC.getAddress(),
    "Équilibrée",
    treasury.address,
    tokenRegistry.getAddress(),
    mockPriceFeed.getAddress()
  );
  await vault.waitForDeployment();

  return {
    vault,
    mockUSDC,
    tokenRegistry,
    mockPriceFeed,
    owner,
    user1,
    user2,
    treasury,
  };
}
