import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Vault, MockUSDC } from "../typechain-types";
import { deployVaultFixture } from "./fixtures";

describe("Vault.sol – Invariants", function () {
  describe("Vault – Configuration de base", function () {
    it("a un asset valide non nul", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      expect(await vault.asset()).to.not.eq(ethers.ZeroAddress);
    });

    it("l'asset correspond bien au MockUSDC déployé", async function () {
      const { vault, mockUSDC } = await loadFixture(deployVaultFixture);

      expect(await vault.asset()).to.eq(await mockUSDC.getAddress());
    });

    it("a un treasury valide non nul", async function () {
      const { vault, treasury } = await loadFixture(deployVaultFixture);

      expect(await vault.treasury()).to.not.eq(ethers.ZeroAddress);
      expect(await vault.treasury()).to.eq(treasury.address);
    });

    it("a un registry valide non nul", async function () {
      const { vault, tokenRegistry } = await loadFixture(deployVaultFixture);

      expect(await vault.registry()).to.not.eq(ethers.ZeroAddress);
      expect(await vault.registry()).to.eq(await tokenRegistry.getAddress());
    });
  });

  describe("Vault – Cohérence des assets", function () {
    it("totalAssets retourne le bon solde USDC initial", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      expect(await vault.totalAssets()).to.eq(0);
    });

    it("totalAssets retourne le bon solde USDC après dépôt", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      expect(await vault.totalAssets()).to.eq(depositAmount);
    });

    it("totalAssets retourne le bon solde USDC après retrait", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Retrait partiel
      const withdrawAmount = ethers.parseUnits("300", 6);
      await vault
        .connect(user1)
        .withdraw(withdrawAmount, user1.address, user1.address);

      expect(await vault.totalAssets()).to.eq(depositAmount - withdrawAmount);
    });

    it("totalAssets correspond au solde réel du token dans le Vault", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const vaultBalance = await mockUSDC.balanceOf(await vault.getAddress());
      expect(await vault.totalAssets()).to.eq(vaultBalance);
    });
  });

  describe("Vault – Cohérence shares/assets", function () {
    it("convertToShares et convertToAssets sont cohérents (1:1 ratio)", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const amount = ethers.parseUnits("500", 6);
      const shares = await vault.convertToShares(amount);
      expect(shares).to.eq(amount * 10n ** 12n); // 6→18 décimales

      // Conversion inverse
      expect(await vault.convertToAssets(shares)).to.eq(amount);
    });

    it("conserve la cohérence entre shares et assets après dépôt", async function () {
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

    it("conserve la cohérence entre shares et assets après retrait", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Retrait partiel
      const withdrawAmount = ethers.parseUnits("300", 6);
      await vault
        .connect(user1)
        .withdraw(withdrawAmount, user1.address, user1.address);

      const remainingShares = await vault.balanceOf(user1.address);
      const remainingAssets = await vault.convertToAssets(remainingShares);

      expect(remainingAssets).to.eq(depositAmount - withdrawAmount);
    });

    it("convertToShares(0) retourne 0", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const shares = await vault.convertToShares(0);
      expect(shares).to.eq(0);
    });

    it("convertToAssets(0) retourne 0", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const assets = await vault.convertToAssets(0);
      expect(assets).to.eq(0);
    });

    it("convertToShares et convertToAssets sont symétriques", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const originalAmount = ethers.parseUnits("750", 6);
      const shares = await vault.convertToShares(originalAmount);
      const convertedBack = await vault.convertToAssets(shares);

      expect(convertedBack).to.eq(originalAmount);
    });
  });

  describe("Vault – Cohérence du totalSupply", function () {
    it("totalSupply est cohérent avec les balances des utilisateurs", async function () {
      const { vault, mockUSDC, user1, user2 } = await loadFixture(
        deployVaultFixture
      );

      // Dépôts de deux utilisateurs
      const deposit1 = ethers.parseUnits("1000", 6);
      const deposit2 = ethers.parseUnits("500", 6);

      await mockUSDC.connect(user1).approve(await vault.getAddress(), deposit1);
      await mockUSDC.connect(user2).approve(await vault.getAddress(), deposit2);

      await vault.connect(user1).deposit(deposit1, user1.address);
      await vault.connect(user2).deposit(deposit2, user2.address);

      const balance1 = await vault.balanceOf(user1.address);
      const balance2 = await vault.balanceOf(user2.address);
      const totalSupply = await vault.totalSupply();

      expect(totalSupply).to.eq(balance1 + balance2);
    });

    it("totalSupply augmente correctement après accrue de frais", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      // Définir le feeReceiver
      await vault.connect(owner).setFeeReceiver(user1.address);

      const totalSupplyBefore = await vault.totalSupply();
      const feeShares = ethers.parseUnits("1000", 18);

      await vault.connect(owner).accrueManagementFee(feeShares);

      expect(await vault.totalSupply()).to.eq(totalSupplyBefore + feeShares);
    });
  });

  describe("Vault – Invariants ERC4626", function () {
    it("previewDeposit retourne la même valeur que convertToShares", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const amount = ethers.parseUnits("250", 6);
      const previewShares = await vault.previewDeposit(amount);
      const convertedShares = await vault.convertToShares(amount);

      expect(previewShares).to.eq(convertedShares);
    });

    it("previewRedeem retourne la même valeur que convertToAssets", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const shares = ethers.parseUnits("500", 18);
      const previewAssets = await vault.previewRedeem(shares);
      const convertedAssets = await vault.convertToAssets(shares);

      expect(previewAssets).to.eq(convertedAssets);
    });

    it("maxDeposit retourne la valeur maximale possible", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      const maxDeposit = await vault.maxDeposit(user1.address);
      // Dans notre cas simple, maxDeposit devrait être très élevé (type(uint256).max)
      expect(maxDeposit).to.be.gt(0);
    });

    it("maxRedeem retourne le bon nombre de shares", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Dépôt initial
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const maxRedeem = await vault.maxRedeem(user1.address);
      const userBalance = await vault.balanceOf(user1.address);

      expect(maxRedeem).to.eq(userBalance);
    });
  });
});
