import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Vault, MockUSDC, MockGold, TokenRegistry } from "../typechain-types";

describe("Vault.sol – Intégration TokenRegistry", function () {
  async function deployVaultFixture() {
    const [owner, user1, user2, treasury] = await ethers.getSigners();

    // Déploiement du TokenRegistry
    const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
    const tokenRegistry = await TokenRegistry.deploy();
    await tokenRegistry.waitForDeployment();

    // Déploiement du MockUSDC (6 décimales)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    await mockUSDC.waitForDeployment();

    // Déploiement du MockGold (non enregistré dans le registry)
    const MockGold = await ethers.getContractFactory("MockGold");
    const mockGold = await MockGold.deploy();
    await mockGold.waitForDeployment();

    // Mint USDC pour les utilisateurs
    await mockUSDC.mint(owner.address, ethers.parseUnits("10000", 6));
    await mockUSDC.mint(user1.address, ethers.parseUnits("10000", 6));
    await mockUSDC.mint(user2.address, ethers.parseUnits("10000", 6));

    // Enregistrement du MockUSDC dans le TokenRegistry
    await tokenRegistry.registerToken(await mockUSDC.getAddress(), "mUSDC", 6);

    // Déploiement du MockPriceFeed
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
    await mockPriceFeed.waitForDeployment();

    // Configuration du prix USDC (1 USDC = 1 USDC)
    const usdcPrice = ethers.parseUnits("1", 6);
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

    return {
      vault,
      mockUSDC,
      mockGold,
      tokenRegistry,
      mockPriceFeed,
      owner,
      user1,
      user2,
      treasury,
    };
  }

  describe("Validation des tokens via TokenRegistry", function () {
    it("accepte setAllocations avec un token enregistré dans le TokenRegistry", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

      const validAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("1", 18), // 100% sur MockUSDC
          active: true,
        },
      ];

      await expect(vault.connect(owner).setAllocations(validAllocations))
        .to.emit(vault, "AllocationsUpdated")
        .withArgs(owner.address);

      const retrievedAllocations = await vault.getAllocations();
      expect(retrievedAllocations).to.have.length(1);
      expect(retrievedAllocations[0].token).to.eq(await mockUSDC.getAddress());
      expect(retrievedAllocations[0].weight).to.eq(ethers.parseUnits("1", 18));
      expect(retrievedAllocations[0].active).to.eq(true);
    });

    it("revert si on tente de setAllocations avec un token non enregistré", async function () {
      const { vault, mockGold, owner } = await loadFixture(deployVaultFixture);

      const invalidAllocations = [
        {
          token: await mockGold.getAddress(),
          weight: ethers.parseUnits("1", 18), // 100% sur MockGold
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "TokenNotRegistered");
    });

    it("permet d'ajouter un token non enregistré si active = false", async function () {
      const { vault, mockUSDC, mockGold, owner } = await loadFixture(
        deployVaultFixture
      );

      const allocationsWithInactiveToken = [
        {
          token: await mockGold.getAddress(),
          weight: ethers.parseUnits("0", 18), // 0% de poids
          active: false, // Token inactif
        },
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("1", 18), // 100% sur MockUSDC
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(allocationsWithInactiveToken)
      )
        .to.emit(vault, "AllocationsUpdated")
        .withArgs(owner.address);

      const retrievedAllocations = await vault.getAllocations();
      expect(retrievedAllocations).to.have.length(2);
      expect(retrievedAllocations[0].token).to.eq(await mockGold.getAddress());
      expect(retrievedAllocations[0].active).to.eq(false);
      expect(retrievedAllocations[1].token).to.eq(await mockUSDC.getAddress());
      expect(retrievedAllocations[1].active).to.eq(true);
    });

    it("revert si on tente d'activer un token non enregistré", async function () {
      const { vault, mockGold, owner } = await loadFixture(deployVaultFixture);

      const invalidAllocations = [
        {
          token: await mockGold.getAddress(),
          weight: ethers.parseUnits("1", 18), // 100% sur MockGold
          active: true, // Token actif mais non enregistré
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "TokenNotRegistered");
    });
  });

  describe("Intégration avec TokenRegistry.isTokenRegistered()", function () {
    it("vérifie que le Vault utilise bien registry.isTokenRegistered()", async function () {
      const { vault, mockUSDC, mockGold, tokenRegistry, owner } =
        await loadFixture(deployVaultFixture);

      // Vérifier que MockUSDC est enregistré
      expect(
        await tokenRegistry.isTokenRegistered(await mockUSDC.getAddress())
      ).to.eq(true);

      // Vérifier que MockGold n'est pas enregistré
      expect(
        await tokenRegistry.isTokenRegistered(await mockGold.getAddress())
      ).to.eq(false);

      // Test avec MockUSDC (enregistré) - doit passer
      const validAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(validAllocations)
      ).to.emit(vault, "AllocationsUpdated");

      // Test avec MockGold (non enregistré) - doit échouer
      const invalidAllocations = [
        {
          token: await mockGold.getAddress(),
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "TokenNotRegistered");
    });

    it("permet de configurer une allocation après enregistrement d'un nouveau token", async function () {
      const { vault, mockGold, tokenRegistry, owner } = await loadFixture(
        deployVaultFixture
      );

      // Initialement, MockGold n'est pas enregistré
      expect(
        await tokenRegistry.isTokenRegistered(await mockGold.getAddress())
      ).to.eq(false);

      // Tentative d'allocation avec MockGold non enregistré - doit échouer
      const invalidAllocations = [
        {
          token: await mockGold.getAddress(),
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "TokenNotRegistered");

      // Enregistrer MockGold dans le TokenRegistry
      await tokenRegistry.registerToken(
        await mockGold.getAddress(),
        "mGOLD",
        18
      );

      // Vérifier que MockGold est maintenant enregistré
      expect(
        await tokenRegistry.isTokenRegistered(await mockGold.getAddress())
      ).to.eq(true);

      // Maintenant l'allocation avec MockGold doit passer
      await expect(vault.connect(owner).setAllocations(invalidAllocations))
        .to.emit(vault, "AllocationsUpdated")
        .withArgs(owner.address);

      const retrievedAllocations = await vault.getAllocations();
      expect(retrievedAllocations).to.have.length(1);
      expect(retrievedAllocations[0].token).to.eq(await mockGold.getAddress());
      expect(retrievedAllocations[0].active).to.eq(true);
    });
  });

  describe("Gestion des erreurs du TokenRegistry", function () {
    it("revert avec TokenNotRegistered pour un token inexistant", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      // Adresse d'un token qui n'existe pas
      const nonExistentToken = "0x1234567890123456789012345678901234567890";

      const invalidAllocations = [
        {
          token: nonExistentToken,
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "TokenNotRegistered");
    });

    it("revert avec TokenNotRegistered pour l'adresse zéro", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const invalidAllocations = [
        {
          token: ethers.ZeroAddress,
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      // Doit d'abord échouer sur ZeroAddress, puis sur TokenNotRegistered
      // Le test vérifie que ZeroAddress est vérifié en premier
      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });
  });

  describe("Allocations mixtes avec tokens enregistrés et non enregistrés", function () {
    it("revert si au moins un token actif n'est pas enregistré", async function () {
      const { vault, mockUSDC, mockGold, owner } = await loadFixture(
        deployVaultFixture
      );

      const mixedAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("0.5", 18), // 50% sur MockUSDC (enregistré)
          active: true,
        },
        {
          token: await mockGold.getAddress(),
          weight: ethers.parseUnits("0.5", 18), // 50% sur MockGold (non enregistré)
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(mixedAllocations)
      ).to.be.revertedWithCustomError(vault, "TokenNotRegistered");
    });

    it("accepte une allocation mixte si tous les tokens actifs sont enregistrés", async function () {
      const { vault, mockUSDC, mockGold, tokenRegistry, owner } =
        await loadFixture(deployVaultFixture);

      // Enregistrer MockGold
      await tokenRegistry.registerToken(
        await mockGold.getAddress(),
        "mGOLD",
        18
      );

      const validMixedAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("0.6", 18), // 60% sur MockUSDC
          active: true,
        },
        {
          token: await mockGold.getAddress(),
          weight: ethers.parseUnits("0.4", 18), // 40% sur MockGold
          active: true,
        },
      ];

      await expect(vault.connect(owner).setAllocations(validMixedAllocations))
        .to.emit(vault, "AllocationsUpdated")
        .withArgs(owner.address);

      const retrievedAllocations = await vault.getAllocations();
      expect(retrievedAllocations).to.have.length(2);
      expect(retrievedAllocations[0].token).to.eq(await mockUSDC.getAddress());
      expect(retrievedAllocations[0].active).to.eq(true);
      expect(retrievedAllocations[1].token).to.eq(await mockGold.getAddress());
      expect(retrievedAllocations[1].active).to.eq(true);
    });
  });
});
