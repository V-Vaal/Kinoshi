import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Vault, MockUSDC } from "../typechain-types";

describe("Vault.sol – Kinoshi", function () {
  async function deployVaultFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Déploiement du MockUSDC (6 décimales)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    await mockUSDC.waitForDeployment();

    // Mint USDC pour les utilisateurs
    await mockUSDC.mint(owner.address, ethers.parseUnits("10000", 6));
    await mockUSDC.mint(user1.address, ethers.parseUnits("10000", 6));
    await mockUSDC.mint(user2.address, ethers.parseUnits("10000", 6));

    // Déploiement du Vault avec stratégie "Équilibrée"
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await mockUSDC.getAddress(), "Équilibrée");
    await vault.waitForDeployment();

    // Définition d'une allocation 100% USDC
    const allocations = [
      {
        token: await mockUSDC.getAddress(),
        weight: ethers.parseUnits("1", 18), // 100% sur USDC
        active: true,
      },
    ];

    // Configuration de l'allocation (owner only)
    await vault.connect(owner).setAllocations(allocations);

    return { vault, mockUSDC, owner, user1, user2, allocations };
  }

  describe("Vault – Déploiement", function () {
    it("déploie correctement avec le bon asset et label", async function () {
      const { vault, mockUSDC } = await loadFixture(deployVaultFixture);

      expect(await vault.asset()).to.eq(await mockUSDC.getAddress());
      expect(await vault.strategyLabel()).to.eq("Équilibrée");
      expect(await vault.paused()).to.eq(false);
      expect(await vault.totalSupply()).to.eq(0);
    });
  });

  describe("Vault – Allocation de stratégie", function () {
    it("permet de configurer une allocation valide", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

      const newAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      await expect(vault.connect(owner).setAllocations(newAllocations))
        .to.emit(vault, "AllocationsUpdated")
        .withArgs(owner.address);

      const retrievedAllocations = await vault.getAllocations();
      expect(retrievedAllocations).to.have.length(1);
      expect(retrievedAllocations[0].token).to.eq(await mockUSDC.getAddress());
      expect(retrievedAllocations[0].weight).to.eq(ethers.parseUnits("1", 18));
      expect(retrievedAllocations[0].active).to.eq(true);
    });

    it("revert si on essaie d'ajouter une adresse nulle", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const invalidAllocations = [
        {
          token: ethers.ZeroAddress,
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("revert si la somme des poids n'est pas égale à 1e18", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

      const invalidAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("0.5", 18), // 50% seulement
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "InvalidWeightSum");
    });

    it("revert si on essaie d'ajouter 0 allocations", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const emptyAllocations: any[] = [];

      await expect(
        vault.connect(owner).setAllocations(emptyAllocations)
      ).to.be.revertedWith("Allocations cannot be empty");
    });

    it("retourne l'allocation actuelle via getAllocations()", async function () {
      const { vault, mockUSDC } = await loadFixture(deployVaultFixture);

      const allocations = await vault.getAllocations();
      expect(allocations).to.have.length(1);
      expect(allocations[0].token).to.eq(await mockUSDC.getAddress());
      expect(allocations[0].weight).to.eq(ethers.parseUnits("1", 18));
      expect(allocations[0].active).to.eq(true);
    });
  });

  describe("Vault – Dépôts et retraits", function () {
    it("permet un dépôt et mint des shares", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);

      await expect(vault.connect(user1).deposit(depositAmount, user1.address))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, depositAmount);

      expect(await vault.totalAssets()).to.eq(depositAmount);
      expect(await vault.balanceOf(user1.address)).to.eq(
        depositAmount * 10n ** 12n
      ); // 6→18 décimales
      expect(await mockUSDC.balanceOf(user1.address)).to.eq(
        ethers.parseUnits("9000", 6)
      );
    });

    it("convertit correctement les assets en shares (1:1, 6→18 décimales)", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const amount = ethers.parseUnits("500", 6);
      const shares = await vault.convertToShares(amount);
      expect(shares).to.eq(amount * 10n ** 12n);

      // Conversion inverse
      expect(await vault.convertToAssets(shares)).to.eq(amount);
    });

    it("permet un retrait via withdraw()", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const withdrawAmount = ethers.parseUnits("500", 6);
      const shares = await vault.convertToShares(withdrawAmount);

      await expect(
        vault
          .connect(user1)
          .withdraw(withdrawAmount, user1.address, user1.address)
      )
        .to.emit(vault, "WithdrawExecuted")
        .withArgs(user1.address, user1.address, withdrawAmount);

      expect(await vault.balanceOf(user1.address)).to.eq(shares);
      expect(await mockUSDC.balanceOf(user1.address)).to.eq(
        ethers.parseUnits("9500", 6)
      );
    });

    it("permet un retrait via redeem()", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      await expect(
        vault.connect(user1).redeem(redeemShares, user1.address, user1.address)
      )
        .to.emit(vault, "Withdraw")
        .withArgs(
          user1.address,
          user1.address,
          user1.address,
          depositAmount / 2n,
          redeemShares
        );

      expect(await vault.balanceOf(user1.address)).to.eq(shares - redeemShares);
    });

    it("revert si on essaie de déposer 0", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).deposit(0, user1.address)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("revert si on essaie de retirer 0", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).withdraw(0, user1.address, user1.address)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("revert si on essaie de redeemer 0", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).redeem(0, user1.address, user1.address)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });
  });

  describe("Vault – Pausable", function () {
    it("permet à l'owner de pauser et unpause", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(user1).pause()).to.be.reverted; // not owner

      await vault.connect(owner).pause();
      expect(await vault.paused()).to.eq(true);

      await vault.connect(owner).unpause();
      expect(await vault.paused()).to.eq(false);
    });

    it("bloque les dépôts quand le contrat est en pause", async function () {
      const { vault, mockUSDC, owner, user1 } = await loadFixture(
        deployVaultFixture
      );

      await vault.connect(owner).pause();

      const amount = ethers.parseUnits("1000", 6);
      await mockUSDC.connect(user1).approve(await vault.getAddress(), amount);

      await expect(
        vault.connect(user1).deposit(amount, user1.address)
      ).to.be.revertedWithCustomError(vault, "Pausable__Paused");
    });

    it("bloque les retraits quand le contrat est en pause", async function () {
      const { vault, mockUSDC, owner, user1 } = await loadFixture(
        deployVaultFixture
      );

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      await vault.connect(owner).pause();

      await expect(
        vault
          .connect(user1)
          .withdraw(depositAmount, user1.address, user1.address)
      ).to.be.revertedWithCustomError(vault, "Pausable__Paused");
    });
  });

  describe("Vault – Sécurité", function () {
    it("revert si on tente d'envoyer de l'ETH au Vault", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        user1.sendTransaction({
          to: await vault.getAddress(),
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(vault, "EtherNotAccepted");
    });

    it("revert sur fallback avec ETH", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        user1.sendTransaction({
          to: await vault.getAddress(),
          value: ethers.parseEther("1"),
          data: "0x1234", // Données invalides pour déclencher fallback
        })
      ).to.be.revertedWithCustomError(vault, "EtherNotAccepted");
    });
  });

  describe("Vault – Invariants", function () {
    it("a un asset valide non nul", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      expect(await vault.asset()).to.not.eq(ethers.ZeroAddress);
    });

    it("totalAssets retourne le bon solde USDC", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      expect(await vault.totalAssets()).to.eq(0);

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      expect(await vault.totalAssets()).to.eq(depositAmount);
    });

    it("conserve la cohérence entre shares et assets", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const shares = await vault.balanceOf(user1.address);
      const convertedAssets = await vault.convertToAssets(shares);

      expect(convertedAssets).to.eq(depositAmount);
    });
  });
});
