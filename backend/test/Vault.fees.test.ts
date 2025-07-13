import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Vault, MockUSDC } from "../typechain-types";
import { deployVaultFixture } from "./fixtures";

describe("Vault.sol – Fees", function () {
  describe("Vault – Management Fees", function () {
    it("permet à l'owner de définir un feeReceiver valide", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).setFeeReceiver(user1.address);
      expect(await vault.feeReceiver()).to.eq(user1.address);
    });

    it("revert si on essaie de définir une adresse nulle", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).setFeeReceiver(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("revert si un non-owner essaie de définir le feeReceiver", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setFeeReceiver(user1.address)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("accrueManagementFee() mint les shares vers le feeReceiver", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      // Définir le feeReceiver
      await vault.connect(owner).setFeeReceiver(user1.address);

      // Balance initiale
      const totalSupplyBefore = await vault.totalSupply();
      const feeReceiverBalanceBefore = await vault.balanceOf(user1.address);

      // Accrue des frais de gestion
      const feeShares = ethers.parseUnits("1000", 18); // 1000 shares (18 décimales)
      await vault.connect(owner).accrueManagementFee(feeShares);

      // Vérifier les résultats
      expect(await vault.totalSupply()).to.eq(totalSupplyBefore + feeShares);
      expect(await vault.balanceOf(user1.address)).to.eq(
        feeReceiverBalanceBefore + feeShares
      );
    });

    it("émet l'event ManagementFeeAccrued avec les bons arguments", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      // Définir le feeReceiver
      await vault.connect(owner).setFeeReceiver(user1.address);

      // Accrue des frais de gestion
      const feeShares = ethers.parseUnits("1000", 18);
      await expect(vault.connect(owner).accrueManagementFee(feeShares))
        .to.emit(vault, "ManagementFeeAccrued")
        .withArgs(user1.address, feeShares);
    });

    it("revert si un non-owner essaie d'accrue des frais", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      const feeShares = ethers.parseUnits("1000", 18);
      await expect(
        vault.connect(user1).accrueManagementFee(feeShares)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("revert si on essaie d'accrue 0 shares", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      // Définir le feeReceiver
      await vault.connect(owner).setFeeReceiver(user1.address);

      await expect(
        vault.connect(owner).accrueManagementFee(0)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("vérifie que totalSupply et balanceOf augmentent correctement", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      // Définir le feeReceiver
      await vault.connect(owner).setFeeReceiver(user1.address);

      // État initial
      const initialTotalSupply = await vault.totalSupply();
      const initialFeeReceiverBalance = await vault.balanceOf(user1.address);

      // Accrue des frais
      const feeShares = ethers.parseUnits("1000", 18);
      await vault.connect(owner).accrueManagementFee(feeShares);

      // Vérifier l'augmentation
      expect(await vault.totalSupply()).to.eq(initialTotalSupply + feeShares);
      expect(await vault.balanceOf(user1.address)).to.eq(
        initialFeeReceiverBalance + feeShares
      );

      // Accrue de nouveaux frais
      const additionalFeeShares = ethers.parseUnits("500", 18);
      await vault.connect(owner).accrueManagementFee(additionalFeeShares);

      // Vérifier l'augmentation cumulative
      expect(await vault.totalSupply()).to.eq(
        initialTotalSupply + feeShares + additionalFeeShares
      );
      expect(await vault.balanceOf(user1.address)).to.eq(
        initialFeeReceiverBalance + feeShares + additionalFeeShares
      );
    });
  });

  describe("Vault – Exit Fees", function () {
    it("setExitFeeBps() fonctionne correctement (onlyOwner)", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const newFeeBps = 100; // 1%
      await vault.connect(owner).setExitFeeBps(newFeeBps);
      expect(await vault.exitFeeBps()).to.eq(newFeeBps);
    });

    it("le redeem() applique bien le fee quand exitFeeBps > 0", async function () {
      const { vault, mockUSDC, user1, treasury, owner } = await loadFixture(
        deployVaultFixture
      );

      // Configurer les frais de sortie à 1% (100 basis points)
      await vault.connect(owner).setExitFeeBps(100);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Balance initiale du treasury
      const treasuryBalanceBefore = await mockUSDC.balanceOf(treasury.address);

      // Redeem la moitié des shares
      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      await vault
        .connect(user1)
        .redeem(redeemShares, user1.address, user1.address);

      // Vérifier que le treasury a reçu les frais
      const treasuryBalanceAfter = await mockUSDC.balanceOf(treasury.address);
      expect(treasuryBalanceAfter).to.be.gt(treasuryBalanceBefore);
    });

    it("le redeem() n'applique pas de fee quand exitFeeBps == 0", async function () {
      const { vault, mockUSDC, user1, treasury, owner } = await loadFixture(
        deployVaultFixture
      );

      // S'assurer que les frais sont à 0
      await vault.connect(owner).setExitFeeBps(0);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Balance initiale du treasury
      const treasuryBalanceBefore = await mockUSDC.balanceOf(treasury.address);

      // Redeem la moitié des shares
      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      await expect(
        vault.connect(user1).redeem(redeemShares, user1.address, user1.address)
      ).to.not.emit(vault, "ExitFeeApplied");

      // Vérifier que le treasury n'a pas reçu de frais
      const treasuryBalanceAfter = await mockUSDC.balanceOf(treasury.address);
      expect(treasuryBalanceAfter).to.eq(treasuryBalanceBefore);
    });

    it("le transfert du fee au treasury est correct", async function () {
      const { vault, mockUSDC, user1, treasury, owner } = await loadFixture(
        deployVaultFixture
      );

      // Configurer les frais de sortie à 2% (200 basis points)
      await vault.connect(owner).setExitFeeBps(200);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Balance initiale du treasury
      const treasuryBalanceBefore = await mockUSDC.balanceOf(treasury.address);

      // Redeem la moitié des shares
      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      await vault
        .connect(user1)
        .redeem(redeemShares, user1.address, user1.address);

      // Vérifier que le treasury a reçu exactement 2% des assets redeemés
      const treasuryBalanceAfter = await mockUSDC.balanceOf(treasury.address);
      const feeReceived = treasuryBalanceAfter - treasuryBalanceBefore;
      const expectedFee = ((depositAmount / 2n) * 200n) / 10000n; // 2% de la moitié
      expect(feeReceived).to.eq(expectedFee);
    });

    it("l'event ExitFeeApplied() est émis avec les bonnes valeurs", async function () {
      const { vault, mockUSDC, user1, owner } = await loadFixture(
        deployVaultFixture
      );

      // Configurer les frais de sortie à 1% (100 basis points)
      await vault.connect(owner).setExitFeeBps(100);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Redeem la moitié des shares
      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      await expect(
        vault.connect(user1).redeem(redeemShares, user1.address, user1.address)
      )
        .to.emit(vault, "ExitFeeApplied")
        .withArgs(
          user1.address,
          depositAmount / 2n,
          ((depositAmount / 2n) * 100n) / 10000n
        );
    });

    it("un non-owner ne peut pas modifier les frais", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      const newFeeBps = 100;
      await expect(
        vault.connect(user1).setExitFeeBps(newFeeBps)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("exitFeeBps ne peut pas dépasser MAX_FEE_BPS", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const maxFeeBps = await vault.MAX_FEE_BPS();
      const invalidFeeBps = maxFeeBps + 1n;

      await expect(
        vault.connect(owner).setExitFeeBps(invalidFeeBps)
      ).to.be.revertedWith("Fee exceeds maximum");
    });
  });
});
