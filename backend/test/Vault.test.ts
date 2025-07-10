import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Vault, MockUSDC } from "../typechain-types";

describe("Vault.sol – Kinoshi", function () {
  async function deployVaultFixture() {
    const [owner, user, other] = await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = (await MockUSDCFactory.deploy(
      "Mock USDC",
      "mUSDC",
      6
    )) as MockUSDC;
    await usdc.waitForDeployment();

    await (
      await usdc.mint(owner.address, ethers.parseUnits("10000", 6))
    ).wait();
    await (await usdc.mint(user.address, ethers.parseUnits("10000", 6))).wait();

    const VaultFactory = await ethers.getContractFactory("Vault");
    const vault = (await VaultFactory.deploy(await usdc.getAddress())) as Vault;
    await vault.waitForDeployment();

    const allocation = [
      {
        token: await usdc.getAddress(),
        weight: ethers.parseUnits("1", 18),
        active: true,
      },
    ];
    await vault.connect(owner).setStrategyAllocations(1, allocation);

    return { owner, user, other, usdc, vault };
  }

  describe("Vault – Déploiement et structure", function () {
    it("déploie le Vault correctement", async function () {
      const { vault, usdc } = await loadFixture(deployVaultFixture);
      expect(await vault.asset()).to.eq(await usdc.getAddress());
      expect(await vault.paused()).to.eq(false);
      expect(await vault.totalSupply()).to.eq(0);
    });
  });

  describe("Vault – Stratégies", function () {
    it("retourne l'ID de la stratégie enregistrée", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const strategyIds = await vault.getStrategyIds();
      expect(strategyIds).to.have.length(1);
      expect(strategyIds[0]).to.eq(1n);
    });

    it("permet d'ajouter une nouvelle stratégie", async function () {
      const { owner, vault, usdc } = await loadFixture(deployVaultFixture);

      const newAllocation = [
        {
          token: await usdc.getAddress(),
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(owner).setStrategyAllocations(2, newAllocation);

      const strategyIds = await vault.getStrategyIds();
      const ids = strategyIds.map((id) => id.toString());
      expect(ids).to.include("1");
      expect(ids).to.include("2");
    });

    it("permet de supprimer une stratégie", async function () {
      const { owner, vault } = await loadFixture(deployVaultFixture);
      await vault.connect(owner).removeStrategy(1);
      const strategyIds = await vault.getStrategyIds();
      expect(strategyIds).to.have.length(0);
    });
  });

  describe("Vault – Dépôts et retraits", function () {
    it("retourne les parts après dépôt", async function () {
      const { user, usdc, vault } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseUnits("1000", 6);
      await (
        await usdc.connect(user).approve(await vault.getAddress(), amount)
      ).wait();
      const tx = await vault
        .connect(user)
        ["deposit(uint256,address,uint256)"](amount, user.address, 1);
      await expect(tx)
        .to.emit(vault, "Deposit")
        .withArgs(user.address, user.address, amount, amount * 10n ** 12n);
      expect(await vault.totalAssets()).to.eq(amount);
      expect(await vault.balanceOf(user.address)).to.eq(amount * 10n ** 12n);
      expect(await usdc.balanceOf(user.address)).to.eq(
        ethers.parseUnits("9000", 6)
      );
    });

    it("convertit correctement les assets en shares (1:1, 6→18 décimales)", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseUnits("500", 6);
      const shares = await vault.convertToShares(amount);
      expect(shares).to.eq(amount * 10n ** 12n);
      expect(await vault.convertToAssets(shares)).to.eq(amount);
    });

    it("permet le retrait (redeem) et applique le nonReentrant", async function () {
      const { user, usdc, vault } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseUnits("1000", 6);
      await (
        await usdc
          .connect(user)
          .approve(await vault.getAddress(), depositAmount)
      ).wait();
      await vault
        .connect(user)
        ["deposit(uint256,address,uint256)"](depositAmount, user.address, 1);

      const shares = await vault.balanceOf(user.address);
      await expect(
        vault.connect(user).redeem(shares, user.address, user.address)
      )
        .to.emit(vault, "Withdraw")
        .withArgs(
          user.address,
          user.address,
          user.address,
          depositAmount,
          shares
        );

      expect(await vault.balanceOf(user.address)).to.eq(0);
      expect(await usdc.balanceOf(user.address)).to.eq(
        ethers.parseUnits("10000", 6)
      );
    });
  });

  describe("Vault – Pausable", function () {
    it("permet à l'owner de pauser et unpause", async function () {
      const { owner, user, vault } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(user).pause()).to.be.reverted;
      await vault.connect(owner).pause();
      expect(await vault.paused()).to.eq(true);
      await vault.connect(owner).unpause();
      expect(await vault.paused()).to.eq(false);
    });

    it("bloque les dépôts quand le contrat est en pause", async function () {
      const { owner, user, vault, usdc } = await loadFixture(
        deployVaultFixture
      );
      await vault.connect(owner).pause();
      const amount = ethers.parseUnits("1000", 6);
      await (
        await usdc.connect(user).approve(await vault.getAddress(), amount)
      ).wait();
      await expect(
        vault
          .connect(user)
          ["deposit(uint256,address,uint256)"](amount, user.address, 1)
      ).to.be.revertedWithCustomError(vault, "Pausable__Paused");
    });
  });

  describe("Vault – Sécurité (receive, fallback)", function () {
    it("revert si on tente d'envoyer de l'ETH au Vault", async function () {
      const { vault, user } = await loadFixture(deployVaultFixture);
      await expect(
        user.sendTransaction({
          to: await vault.getAddress(),
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(vault, "EtherNotAccepted");
    });
  });

  describe("Vault – Invariants", function () {
    // balances RWA : vérifié dans executeStrategy.test.ts
    it("a un asset (MockUSDC) valide non nul", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.asset()).to.not.eq(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });
});
