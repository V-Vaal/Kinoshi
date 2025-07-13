import { ethers } from "hardhat";
import { parseUnits } from "ethers";

export async function deployVaultFixture() {
  const [owner, user1, user2, treasury] = await ethers.getSigners();

  // Déploiement du TokenRegistry
  const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistry.deploy();
  await tokenRegistry.waitForDeployment();

  // Déploiement du MockUSDC (6 décimales)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
  await mockUSDC.waitForDeployment();

  // Mint pour les utilisateurs AVANT toute action (10 000 mUSDC chacun)
  await mockUSDC.mint(owner.address, parseUnits("10000", 6));
  await mockUSDC.mint(user1.address, parseUnits("10000", 6));
  await mockUSDC.mint(user2.address, parseUnits("10000", 6));

  // Enregistrement du MockUSDC dans le TokenRegistry
  await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 6);

  // Déploiement du MockPriceFeed
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
  await mockPriceFeed.waitForDeployment();

  // Configuration des prix par défaut
  const usdcPrice = parseUnits("1", 6); // 1 USDC = 1 USDC
  await mockPriceFeed.setPrice(await mockUSDC.getAddress(), usdcPrice, 6);

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

  // Définition d'une allocation 100% USDC
  const allocations = [
    {
      token: await mockUSDC.getAddress(),
      weight: parseUnits("1", 18), // 100% sur USDC
      active: true,
    },
  ];

  // Configuration de l'allocation (owner only)
  await vault.connect(owner).setAllocations(allocations);

  return {
    vault,
    mockUSDC,
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

  // Déploiement du MockUSDC (6 décimales)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
  await mockUSDC.waitForDeployment();

  // Mint 10 USDC au owner pour le bootstrap
  await mockUSDC.mint(owner.address, parseUnits("10", 6));

  // Enregistrement du MockUSDC dans le TokenRegistry
  await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 6);

  // Déploiement du MockPriceFeed
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
  await mockPriceFeed.waitForDeployment();

  // Configuration des prix par défaut
  const usdcPrice = parseUnits("1", 6); // 1 USDC = 1 USDC
  await mockPriceFeed.setPrice(await mockUSDC.getAddress(), usdcPrice, 6);

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
