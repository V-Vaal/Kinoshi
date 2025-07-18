import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployVaultFixture } from "./fixtures";

describe("Vault – Gestion des frais de gestion", function () {
  describe("accrueManagementFee avec cooldown", function () {
    it("permet d'accrue des frais de gestion avec cooldown", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      // Configurer le fee receiver
      await vault.connect(owner).setFeeReceiver(owner.address);
      await vault.connect(owner).setFees(50, 100); // 1% management fee

      // Dépôt initial pour avoir des shares
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const feeShares = ethers.parseUnits("100", 18);

      // Premier appel réussi
      await expect(vault.connect(owner).accrueManagementFee(feeShares))
        .to.emit(vault, "ManagementFeeAccrued")
        .withArgs(owner.address, feeShares);

      // Deuxième appel immédiat doit échouer
      await expect(
        vault.connect(owner).accrueManagementFee(feeShares)
      ).to.be.revertedWithCustomError(vault, "ManagementFeeCooldownNotMet");
    });

    it("reject si feeReceiver n'est pas configuré", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const feeShares = ethers.parseUnits("100", 18);

      await expect(
        vault.connect(owner).accrueManagementFee(feeShares)
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("reject si shares = 0", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).setFeeReceiver(owner.address);

      await expect(
        vault.connect(owner).accrueManagementFee(0)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });
  });

  describe("calculateManagementFee", function () {
    it("calcule correctement les frais basés sur managementFeeBps", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      // Configurer 1% de frais de gestion
      await vault.connect(owner).setFees(50, 100); // 1% management fee

      // Dépôt de 1000 USDC
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const totalSupply = await vault.totalSupply();
      const expectedFee = (totalSupply * 100n) / 10_000n; // 1% du total supply

      const calculatedFee = await vault.calculateManagementFee();
      expect(calculatedFee).to.eq(expectedFee);
    });

    it("retourne 0 si managementFeeBps = 0", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      // Configurer 0% de frais de gestion
      await vault.connect(owner).setFees(50, 0);

      // Dépôt de 1000 USDC
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const calculatedFee = await vault.calculateManagementFee();
      expect(calculatedFee).to.eq(0);
    });

    it("retourne 0 si totalSupply = 0", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      // Configurer 1% de frais de gestion
      await vault.connect(owner).setFees(50, 100);

      const calculatedFee = await vault.calculateManagementFee();
      expect(calculatedFee).to.eq(0);
    });
  });

  describe("scheduleManagementFee", function () {
    it("programme automatiquement les frais de gestion", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      // Configurer le fee receiver et 1% de frais
      await vault.connect(owner).setFeeReceiver(owner.address);
      await vault.connect(owner).setFees(50, 100);

      // Dépôt de 1000 USDC
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const totalSupplyBefore = await vault.totalSupply();
      const expectedFee = (totalSupplyBefore * 100n) / 10_000n;

      // Programmer les frais
      await expect(vault.connect(owner).scheduleManagementFee())
        .to.emit(vault, "ManagementFeeAccrued")
        .withArgs(owner.address, expectedFee);

      // Vérifier que les shares ont été mintés
      const totalSupplyAfter = await vault.totalSupply();
      expect(totalSupplyAfter).to.eq(totalSupplyBefore + expectedFee);
    });

    it("reject si feeReceiver n'est pas configuré", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      // Configurer 1% de frais mais pas de fee receiver
      await vault.connect(owner).setFees(50, 100);

      // Dépôt de 1000 USDC
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      await expect(
        vault.connect(owner).scheduleManagementFee()
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("reject si managementFeeBps = 0", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      // Configurer le fee receiver mais 0% de frais
      await vault.connect(owner).setFeeReceiver(owner.address);
      await vault.connect(owner).setFees(50, 0);

      // Dépôt de 1000 USDC
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      await expect(
        vault.connect(owner).scheduleManagementFee()
      ).to.be.revertedWithCustomError(vault, "ManagementFeeNotConfigured");
    });
  });

  describe("Contrôles d'accès", function () {
    it("seul un admin peut accrue des frais de gestion", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).setFeeReceiver(owner.address);
      const feeShares = ethers.parseUnits("100", 18);

      // user1 n'est pas admin, doit échouer
      await expect(
        vault.connect(user1).accrueManagementFee(feeShares)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      // owner est admin, doit réussir
      await expect(vault.connect(owner).accrueManagementFee(feeShares)).to.emit(
        vault,
        "ManagementFeeAccrued"
      );
    });

    it("seul un admin peut programmer les frais", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      await vault.connect(owner).setFeeReceiver(owner.address);
      await vault.connect(owner).setFees(50, 100);

      // Dépôt initial pour avoir des shares
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // user1 n'est pas admin, doit échouer
      await expect(
        vault.connect(user1).scheduleManagementFee()
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      // owner est admin, doit réussir
      await expect(vault.connect(owner).scheduleManagementFee()).to.emit(
        vault,
        "ManagementFeeAccrued"
      );
    });
  });
});
