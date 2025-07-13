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
    it("bootstrapVault() initialise le Vault avec 1 USDC vers le treasury", async function () {
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

      // Mint 10 USDC au owner et approve pour le bootstrap
      await mockUSDC.mint(owner.address, parseUnits("10", 6));
      await mockUSDC
        .connect(owner)
        .approve(await vault.getAddress(), parseUnits("10", 6));

      const treasurySharesBefore = await vault.balanceOf(treasury.address);
      const vaultAssetsBefore = await vault.totalAssets();

      // Bootstrap
      await vault.connect(owner).bootstrapVault();

      const treasurySharesAfter = await vault.balanceOf(treasury.address);
      const vaultAssetsAfter = await vault.totalAssets();

      // Vérifier que le treasury a reçu des shares du Vault
      expect(treasurySharesAfter - treasurySharesBefore).to.be.gt(0);

      // Vérifier que le Vault détient maintenant 1 USDC
      expect(vaultAssetsAfter - vaultAssetsBefore).to.equal(1_000_000n);

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
      ).to.not.emit(vault, "ExitFeeApplied");

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

  describe("Vault – Exit Fees", function () {
    it("permet à l'owner de modifier le exitFeeBps", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const newFee = 300;
      await vault.connect(owner).setExitFeeBps(newFee);
      expect(await vault.exitFeeBps()).to.equal(newFee);
    });

    it("revert si un non-owner tente de modifier les frais", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setExitFeeBps(100)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("revert si on dépasse la limite MAX_FEE_BPS", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(owner).setExitFeeBps(1001)).to.be.revertedWith(
        "Fee exceeds maximum"
      );
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

      await vault.connect(owner).setExitFeeBps(500); // 5%

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
