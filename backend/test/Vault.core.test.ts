import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Vault, MockUSDC } from "../typechain-types";
import { deployVaultFixture, deployVaultFixtureEmpty } from "./fixtures";
import { parseUnits } from "ethers";

describe("Vault.sol – Core", function () {
  describe("Vault – Déploiement", function () {
    it("déploie correctement avec le bon asset et label", async function () {
      const { vault, mockUSDC } = await loadFixture(deployVaultFixture);
      expect(await vault.asset()).to.equal(await mockUSDC.getAddress());
      expect(await vault.strategyLabel()).to.equal("Équilibrée");
    });

    it("a le bon nom ERC20", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.name()).to.equal("Kinoshi Vault Share");
    });
  });

  describe("Vault – Bootstrap", function () {
    it("bootstrapVault() initialise le Vault avec 200 USDC vers le treasury", async function () {
      const { vault, owner, mockUSDC, treasury, tokenRegistry } =
        await loadFixture(deployVaultFixtureEmpty);

      // Définir une allocation 100% USDC (obligatoire avant bootstrap)
      const allocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      // Mint 200 USDC au treasury et approve pour le bootstrap
      await mockUSDC.mint(treasury.address, parseUnits("200", 6));
      await mockUSDC
        .connect(treasury)
        .approve(await vault.getAddress(), parseUnits("200", 6));

      const treasurySharesBefore = await vault.balanceOf(treasury.address);
      const vaultAssetsBefore = await vault.totalAssets();

      // Bootstrap
      await vault.connect(owner).bootstrapVault();

      const treasurySharesAfter = await vault.balanceOf(treasury.address);
      const vaultAssetsAfter = await vault.totalAssets();

      // Vérifier que le treasury a reçu des shares du Vault
      expect(treasurySharesAfter - treasurySharesBefore).to.be.gt(0);

      // Vérifier que le Vault détient maintenant 200 USDC
      expect(vaultAssetsAfter - vaultAssetsBefore).to.equal(200_000_000n);

      const totalSupply = await vault.totalSupply();
      expect(totalSupply).to.be.gt(0);
    });

    it("revert si bootstrapVault() est appelé après un dépôt", async function () {
      const { vault, owner, mockUSDC, tokenRegistry, treasury } =
        await loadFixture(deployVaultFixtureEmpty);

      // Définir une allocation 100% USDC (obligatoire avant bootstrap)
      const allocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocations);

      // Approve et dépôt initial (simulateur d'utilisateur)
      await mockUSDC
        .connect(owner)
        .approve(await vault.getAddress(), parseUnits("2", 6));
      await vault.connect(owner).deposit(parseUnits("1", 6), owner.address);

      // Tente de bootstrap après un dépôt
      await expect(
        vault.connect(owner).bootstrapVault()
      ).to.be.revertedWithCustomError(vault, "VaultAlreadyBootstrapped");
    });
  });

  describe("Vault – Allocation de stratégie", function () {
    it("permet de configurer une allocation valide", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

      const allocation = [
        {
          token: await mockUSDC.getAddress(),
          weight: parseUnits("1", 18),
          active: true,
        },
      ];
      await expect(vault.connect(owner).setAllocations(allocation)).to.not.be
        .reverted;
    });
  });

  describe("Vault – Dépôt, conversion, retrait", function () {
    it("dépôt initial valide", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);

      await expect(vault.connect(user1).deposit(depositAmount, user1.address))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, depositAmount);

      // Après le dépôt, les USDC sont brûlés et convertis en RWA
      // totalAssets() reflète uniquement la valeur des RWA
      expect(await vault.totalAssets()).to.eq(depositAmount); // Supposé 1:1 pour test
      expect(await vault.balanceOf(user1.address)).to.eq(
        depositAmount * 10n ** 12n
      ); // 6→18 décimales
      // Avec allocation 100% USDC, l'utilisateur garde 8000 USDC (10000 - 2 x 1000 brûlés)
      expect(await mockUSDC.balanceOf(user1.address)).to.eq(
        ethers.parseUnits("8000", 6)
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
      ).to.not.emit(vault, "ExitFeeApplied");

      expect(await vault.balanceOf(user1.address)).to.eq(shares - redeemShares);
    });

    it("revert si on essaie de déposer 0", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).deposit(0, user1.address)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("revert si on essaie de redeemer 0", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).redeem(0, user1.address, user1.address)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("gère correctement un token à 8 décimales (MockBTC) avec normalisation 18 décimales", async function () {
      const { ethers } = require("hardhat");
      const { parseUnits } = ethers;
      const [owner, user1] = await ethers.getSigners();

      // Déployer MockBTC à 8 décimales
      const MockBTC = await ethers.getContractFactory("MockUSDC");
      const mockBTC = await MockBTC.deploy("MockBTC", "mBTC", 8);

      // Déployer TokenRegistry et Vault
      const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
      const registry = await TokenRegistry.deploy();
      await registry
        .connect(owner)
        .registerToken(await mockBTC.getAddress(), "mBTC", 8);

      // Déployer un oracle mock
      const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
      const oracle = await MockPriceFeed.deploy(owner.address);
      await oracle.setPrice(
        await mockBTC.getAddress(),
        parseUnits("100000", 8),
        8
      );

      // Déployer le Vault avec MockBTC comme asset (⚠️ uniquement pour ce test)
      const Vault = await ethers.getContractFactory("Vault");
      const vault = await Vault.deploy(
        await mockBTC.getAddress(),
        "BTC Vault",
        owner.address,
        await registry.getAddress(),
        await oracle.getAddress()
      );

      // Allocation 100% MockBTC
      const allocation = [
        {
          token: await mockBTC.getAddress(),
          weight: parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(owner).setAllocations(allocation);

      // Mint 1 BTC à user1
      const fullAmount = parseUnits("1", 8);
      await mockBTC.mint(user1.address, fullAmount);
      await mockBTC
        .connect(user1)
        .approve(await vault.getAddress(), fullAmount);

      // Dépôt de 0.5 BTC
      const depositAmount = parseUnits("0.5", 8);
      const expectedShares = await vault.convertToShares(depositAmount);

      await expect(vault.connect(user1).deposit(depositAmount, user1.address))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, depositAmount);

      // Vérifier le nombre de parts
      const actualShares = await vault.balanceOf(user1.address);
      expect(actualShares).to.eq(expectedShares);

      // Vérifier le montant restituable avec previewRedeem
      const previewAssets = await vault.previewRedeem(expectedShares);
      expect(previewAssets).to.eq(depositAmount);

      // Après le dépôt, totalAssets() reflète la valeur des RWA (ici MockBTC)
      expect(await vault.totalAssets()).to.eq(depositAmount);
    });
  });

  describe("Vault – Exit Fees", function () {
    it("permet à l'owner de modifier les frais via setFees", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const newExitFeeBps = 300;
      const newManagementFeeBps = 100;
      await vault.connect(owner).setFees(newExitFeeBps, newManagementFeeBps);
      expect(await vault.exitFeeBps()).to.equal(newExitFeeBps);
      expect(await vault.managementFeeBps()).to.equal(newManagementFeeBps);
    });

    it("revert si un non-admin tente de modifier les frais", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setFees(100, 50)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("revert si on dépasse la limite MAX_FEE_BPS", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const maxFeeBps = await vault.MAX_FEE_BPS();
      await expect(
        vault.connect(owner).setFees(maxFeeBps + 1n, 0)
      ).to.be.revertedWith("Exit fee too high");
      await expect(
        vault.connect(owner).setFees(0, maxFeeBps + 1n)
      ).to.be.revertedWith("Management fee too high");
    });

    it("n'applique pas de frais si exitFeeBps == 0", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC.connect(user1).approve(vault, depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      const treasuryBalanceBefore = await mockUSDC.balanceOf(
        await vault.treasury()
      );

      await vault
        .connect(user1)
        .redeem(redeemShares, user1.address, user1.address);

      const treasuryBalanceAfter = await mockUSDC.balanceOf(
        await vault.treasury()
      );

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.eq(0);
    });

    it("calcule et applique correctement les frais avec exitFeeBps > 0", async function () {
      const { vault, mockUSDC, user1, treasury, owner } = await loadFixture(
        deployVaultFixture
      );

      await vault.connect(owner).setFees(500, 100); // 5% exit fee, 1% management fee

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC.connect(user1).approve(vault, depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const treasuryBefore = await mockUSDC.balanceOf(treasury.address);
      const userBefore = await mockUSDC.balanceOf(user1.address);

      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      const expectedAssets = depositAmount / 2n;
      const expectedFee = (expectedAssets * 500n) / 10_000n;
      const expectedAfterFee = expectedAssets - expectedFee;

      await expect(
        vault.connect(user1).redeem(redeemShares, user1.address, user1.address)
      )
        .to.emit(vault, "ExitFeeApplied")
        .withArgs(user1.address, expectedAssets, expectedFee);

      const treasuryAfter = await mockUSDC.balanceOf(treasury.address);
      const userAfter = await mockUSDC.balanceOf(user1.address);

      expect(treasuryAfter - treasuryBefore).to.eq(expectedFee);
      expect(userAfter - userBefore).to.eq(expectedAfterFee);
    });
  });
});
