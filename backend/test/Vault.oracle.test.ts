import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { parseUnits } from "ethers";

describe("Vault.sol – Oracle Integration", function () {
  async function deployVaultWithOracleFixture() {
    const [owner, user1, user2, treasury] = await ethers.getSigners();

    // Déploiement du TokenRegistry
    const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
    const tokenRegistry = await TokenRegistry.deploy();
    await tokenRegistry.waitForDeployment();

    // Déploiement des tokens mockés
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    await mockUSDC.waitForDeployment();

    const MockBTC = await ethers.getContractFactory("MockBTC");
    const mockBTC = await MockBTC.deploy();
    await mockBTC.waitForDeployment();

    const MockGold = await ethers.getContractFactory("MockGold");
    const mockGold = await MockGold.deploy();
    await mockGold.waitForDeployment();

    // Enregistrement des tokens
    await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 6);
    await tokenRegistry.registerToken(await mockBTC.getAddress(), "mBTC", 8);
    await tokenRegistry.registerToken(await mockGold.getAddress(), "mGOLD", 18);

    // Déploiement du MockPriceFeed
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
    await mockPriceFeed.waitForDeployment();

    // Configuration des prix
    const usdcPrice = parseUnits("1", 6); // 1 USDC = 1 USDC
    const btcPrice = parseUnits("100000", 6); // 1 BTC = 100,000 USDC
    const goldPrice = parseUnits("2000", 6); // 1 GOLD = 2,000 USDC

    await mockPriceFeed.setPrice(await mockUSDC.getAddress(), usdcPrice, 6);
    await mockPriceFeed.setPrice(await mockBTC.getAddress(), btcPrice, 6);
    await mockPriceFeed.setPrice(await mockGold.getAddress(), goldPrice, 6);

    // Déploiement du Vault
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(
      await mockUSDC.getAddress(),
      "Équilibrée",
      treasury.address,
      tokenRegistry.getAddress(),
      mockPriceFeed.getAddress()
    );
    await vault.waitForDeployment();

    // Mint des tokens pour les tests
    await mockUSDC.mint(owner.address, parseUnits("10000", 6));
    await mockBTC.mint(owner.address, parseUnits("1", 8));
    await mockGold.mint(owner.address, parseUnits("10", 18));

    return {
      vault,
      mockUSDC,
      mockBTC,
      mockGold,
      tokenRegistry,
      mockPriceFeed,
      owner,
      user1,
      user2,
      treasury,
    };
  }

  describe("totalAssets avec Oracle", function () {
    it("retourne 0 quand aucune allocation n'est configurée", async function () {
      const { vault } = await loadFixture(deployVaultWithOracleFixture);

      expect(await vault.totalAssets()).to.equal(0);
    });

    it("calcule correctement la valeur d'une allocation 100% USDC", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(
        deployVaultWithOracleFixture
      );

      // Configuration d'une allocation 100% USDC
      const allocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: parseUnits("1", 18), // 100%
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      // Dépôt de 1000 USDC
      const depositAmount = parseUnits("1000", 6);
      await mockUSDC.approve(await vault.getAddress(), depositAmount);
      await vault.deposit(depositAmount, owner.address);

      // totalAssets devrait retourner 1000 USDC (1:1 avec le prix)
      expect(await vault.totalAssets()).to.equal(depositAmount);
    });

    it("calcule correctement la valeur d'une allocation multi-actifs", async function () {
      const { vault, mockUSDC, mockBTC, mockGold, owner } = await loadFixture(
        deployVaultWithOracleFixture
      );

      // Configuration d'une allocation équilibrée
      const allocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: parseUnits("0.4", 18), // 40%
          active: true,
        },
        {
          token: await mockBTC.getAddress(),
          weight: parseUnits("0.4", 18), // 40%
          active: true,
        },
        {
          token: await mockGold.getAddress(),
          weight: parseUnits("0.2", 18), // 20%
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      // Transfert de tokens au Vault
      const usdcAmount = parseUnits("1000", 6); // 1000 USDC
      const btcAmount = parseUnits("0.01", 8); // 0.01 BTC = 1000 USDC
      const goldAmount = parseUnits("0.5", 18); // 0.5 GOLD = 1000 USDC

      await mockUSDC.transfer(await vault.getAddress(), usdcAmount);
      await mockBTC.transfer(await vault.getAddress(), btcAmount);
      await mockGold.transfer(await vault.getAddress(), goldAmount);

      // Calcul attendu :
      // USDC: 1000 * 0.4 = 400 USDC
      // BTC: 1000 * 0.4 = 400 USDC
      // GOLD: 1000 * 0.2 = 200 USDC
      // Total: 1000 USDC
      const expectedTotal = parseUnits("1000", 6);
      expect(await vault.totalAssets()).to.equal(expectedTotal);
    });

    it("ignore les tokens inactifs dans le calcul", async function () {
      const { vault, mockUSDC, mockBTC, owner } = await loadFixture(
        deployVaultWithOracleFixture
      );

      // Configuration avec un token inactif
      const allocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: parseUnits("1", 18), // 100%
          active: true,
        },
        {
          token: await mockBTC.getAddress(),
          weight: parseUnits("0", 18), // 0%
          active: false,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      // Transfert de tokens au Vault
      const usdcAmount = parseUnits("1000", 6);
      const btcAmount = parseUnits("0.01", 8);

      await mockUSDC.transfer(await vault.getAddress(), usdcAmount);
      await mockBTC.transfer(await vault.getAddress(), btcAmount);

      // Seul l'USDC actif devrait être compté
      expect(await vault.totalAssets()).to.equal(usdcAmount);
    });

    it("revert si l'oracle n'a pas de prix pour un token", async function () {
      const { vault, tokenRegistry, mockPriceFeed, owner } = await loadFixture(
        deployVaultWithOracleFixture
      );

      const MockToken = await ethers.getContractFactory("MockEquity");
      const mockToken = await MockToken.deploy();
      await mockToken.waitForDeployment();

      await tokenRegistry.registerToken(
        await mockToken.getAddress(),
        "mEQUITY",
        18
      );

      const allocations = [
        {
          token: await mockToken.getAddress(),
          weight: parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      await mockToken.mint(await vault.getAddress(), parseUnits("1", 18));

      await expect(vault.totalAssets()).to.be.revertedWithCustomError(
        mockPriceFeed,
        "PriceNotSet"
      );
    });
  });

  describe("Intégration Oracle", function () {
    it("utilise le bon oracle injecté dans le constructeur", async function () {
      const { vault, mockPriceFeed } = await loadFixture(
        deployVaultWithOracleFixture
      );

      expect(await vault.oracle()).to.equal(await mockPriceFeed.getAddress());
    });

    it("reflète les changements de prix de l'oracle", async function () {
      const { vault, mockUSDC, mockPriceFeed, owner } = await loadFixture(
        deployVaultWithOracleFixture
      );

      // Configuration 100% USDC
      const allocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      // Dépôt de 1000 USDC
      const depositAmount = parseUnits("1000", 6);
      await mockUSDC.approve(await vault.getAddress(), depositAmount);
      await vault.deposit(depositAmount, owner.address);

      // Vérifier la valeur initiale
      expect(await vault.totalAssets()).to.equal(depositAmount);

      // Changer le prix de l'USDC (simulation d'une variation)
      const newPrice = parseUnits("1.1", 6); // 1 USDC = 1.1 USDC
      await mockPriceFeed.setPrice(await mockUSDC.getAddress(), newPrice, 6);

      // La valeur devrait maintenant être 1100 USDC
      const expectedNewValue = parseUnits("1100", 6);
      expect(await vault.totalAssets()).to.equal(expectedNewValue);
    });

    it("reflète une manipulation de prix oracle dans totalAssets", async function () {
      const { vault, mockPriceFeed, mockGold, mockUSDC, owner } =
        await loadFixture(deployVaultWithOracleFixture);

      // Configuration 100% GOLD
      const allocations = [
        {
          token: await mockGold.getAddress(),
          weight: parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      // Transfert de 1 GOLD directement au Vault (le Vault détient du GOLD)
      const goldAmount = parseUnits("1", 18);
      await mockGold.transfer(await vault.getAddress(), goldAmount);

      // Prix initial
      await mockPriceFeed.setPrice(
        await mockGold.getAddress(),
        parseUnits("100", 6),
        6
      );
      const before = await vault.totalAssets();

      // Manipulation de prix
      await mockPriceFeed.setPrice(
        await mockGold.getAddress(),
        parseUnits("500", 6),
        6
      );
      const after = await vault.totalAssets();

      expect(after).to.be.gt(before);
    });
  });
});
