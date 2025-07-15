import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployVaultFixture } from "./fixtures";

describe("Vault.sol – Security", function () {
  describe("Vault – Contrôles d'accès", function () {
    it("seul l'owner peut pauser le contrat", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(user1).pause()).to.be.reverted; // not owner

      await vault.connect(owner).pause();
      expect(await vault.paused()).to.eq(true);
    });

    it("seul l'owner peut unpause le contrat", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).pause();
      expect(await vault.paused()).to.eq(true);

      await expect(vault.connect(user1).unpause()).to.be.reverted; // not owner

      await vault.connect(owner).unpause();
      expect(await vault.paused()).to.eq(false);
    });

    it("seul l'owner peut définir le feeReceiver", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setFeeReceiver(user1.address)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");

      await vault.connect(owner).setFeeReceiver(user1.address);
      expect(await vault.feeReceiver()).to.eq(user1.address);
    });

    it("seul l'owner peut accrue des frais de gestion", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).setFeeReceiver(user1.address);

      const feeShares = ethers.parseUnits("1000", 18);
      await expect(
        vault.connect(user1).accrueManagementFee(feeShares)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");

      await vault.connect(owner).accrueManagementFee(feeShares);
    });

    it("seul l'owner peut modifier les allocations", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      const newAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];

      await expect(
        vault.connect(user1).setAllocations(newAllocations)
      ).to.be.revertedWith("Not admin");

      await vault.connect(owner).setAllocations(newAllocations);
    });

    it("seul l'owner peut modifier les frais de sortie et de gestion", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      const newExitFeeBps = 100;
      const newManagementFeeBps = 50;
      await expect(
        vault.connect(user1).setFees(newExitFeeBps, newManagementFeeBps)
      ).to.be.revertedWith("Not admin");

      await vault.connect(owner).setFees(newExitFeeBps, newManagementFeeBps);
      expect(await vault.exitFeeBps()).to.eq(newExitFeeBps);
      expect(await vault.managementFeeBps()).to.eq(newManagementFeeBps);
    });

    it("exitFeeBps et managementFeeBps ne peuvent pas dépasser MAX_FEE_BPS", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const maxFeeBps = await vault.MAX_FEE_BPS();
      const invalidFeeBps = maxFeeBps + 1n;

      await expect(
        vault.connect(owner).setFees(invalidFeeBps, 0)
      ).to.be.revertedWith("Exit fee too high");
      await expect(
        vault.connect(owner).setFees(0, invalidFeeBps)
      ).to.be.revertedWith("Management fee too high");
    });
  });

  describe("Vault – Protection contre les envois ETH", function () {
    it("revert si on tente d'envoyer de l'ETH au Vault via receive()", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        user1.sendTransaction({
          to: await vault.getAddress(),
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(vault, "EtherNotAccepted");
    });

    it("revert sur fallback() avec ETH", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        user1.sendTransaction({
          to: await vault.getAddress(),
          value: ethers.parseEther("1"),
          data: "0x1234",
        })
      ).to.be.revertedWithCustomError(vault, "EtherNotAccepted");
    });

    it("revert sur fallback() sans ETH", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        user1.sendTransaction({
          to: await vault.getAddress(),
          value: 0,
          data: "0x1234",
        })
      ).to.be.revertedWithCustomError(vault, "EtherNotAccepted");
    });
  });

  describe("Vault – Validation des paramètres", function () {
    it("revert si on essaie de définir une adresse nulle pour feeReceiver", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).setFeeReceiver(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("revert si on essaie d'ajouter une adresse nulle dans les allocations", async function () {
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

    it("revert si on essaie d'accrue 0 shares", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).setFeeReceiver(user1.address);

      await expect(
        vault.connect(owner).accrueManagementFee(0)
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
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

    it("revert si on essaie d'ajouter 0 allocations", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const emptyAllocations: any[] = [];

      await expect(
        vault.connect(owner).setAllocations(emptyAllocations)
      ).to.be.revertedWith("Allocations cannot be empty");
    });

    it("revert si la somme des poids n'est pas égale à 1e18", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

      const invalidAllocations = [
        {
          token: await mockUSDC.getAddress(),
          weight: ethers.parseUnits("0.5", 18),
          active: true,
        },
      ];

      await expect(
        vault.connect(owner).setAllocations(invalidAllocations)
      ).to.be.revertedWithCustomError(vault, "InvalidWeightSum");
    });
  });

  describe("Vault – Blocage en pause", function () {
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

    it("bloque les redeems quand le contrat est en pause", async function () {
      const { vault, mockUSDC, owner, user1 } = await loadFixture(
        deployVaultFixture
      );

      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      await vault.connect(owner).pause();

      const shares = await vault.balanceOf(user1.address);
      const redeemShares = shares / 2n;

      await expect(
        vault.connect(user1).redeem(redeemShares, user1.address, user1.address)
      ).to.be.revertedWithCustomError(vault, "Pausable__Paused");
    });
  });

  describe("Vault - Sécurité avancée", function () {
    it("ForceSend : le Vault reste fonctionnel malgré un envoi d'ETH forcé via selfdestruct", async function () {
      const { vault, user1, mockUSDC } = await loadFixture(deployVaultFixture);

      const ForceSendFactory = await ethers.getContractFactory("ForceSend");
      const forceSend = await ForceSendFactory.deploy({
        value: ethers.parseEther("1"),
      });

      // Force send ETH via selfdestruct
      await forceSend.forceSend(await vault.getAddress());

      // Vérification que le vault a bien reçu l’ETH mais reste opérationnel
      const balance = await ethers.provider.getBalance(
        await vault.getAddress()
      );
      expect(balance).to.be.gt(0);

      // Vérifie que deposit() fonctionne toujours
      const amount = ethers.parseUnits("100", 6); // MockUSDC
      await mockUSDC.connect(user1).mint(user1.address, amount);
      await mockUSDC.connect(user1).approve(await vault.getAddress(), amount);

      await expect(vault.connect(user1).deposit(amount, user1.address)).not.to
        .be.reverted;
    });
  });

  it("Front-running : previewDeposit peut être trompeur si des frais de gestion sont prélevés entre temps", async function () {
    const { vault, user1, owner, mockUSDC } = await loadFixture(
      deployVaultFixture
    );

    // user1 dépose d'abord pour initialiser le Vault
    const initialAmount = ethers.parseUnits("1000", 6);
    await mockUSDC.connect(user1).mint(user1.address, initialAmount);
    await mockUSDC
      .connect(user1)
      .approve(await vault.getAddress(), initialAmount);
    await vault.connect(user1).deposit(initialAmount, user1.address);

    // user1 preview pour un nouveau dépôt
    const amount = ethers.parseUnits("100", 6);
    await mockUSDC.connect(user1).mint(user1.address, amount);
    await mockUSDC.connect(user1).approve(await vault.getAddress(), amount);
    const previewShares = await vault.previewDeposit(amount);

    // On définit un feeReceiver valide avant de prélever les frais
    await vault.connect(owner).setFeeReceiver(owner.address);

    // L'owner prélève des frais de gestion (dilution)
    const feeShares = ethers.parseUnits("100", 18); // 100 shares de frais
    await vault.connect(owner).accrueManagementFee(feeShares);

    // user1 effectue finalement son dépôt
    const tx = await vault.connect(user1).deposit(amount, user1.address);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Aucun receipt de transaction");
    // Recherche de l'event Deposit
    const depositEvent = receipt.logs
      .map((log: any) => {
        try {
          return vault.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "Deposit");

    const shares = depositEvent?.args?.[3]; // amountShares
    expect(shares).to.not.equal(previewShares); // le ratio a changé, le résultat n'est pas garanti
  });
});
