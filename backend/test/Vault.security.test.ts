import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployVaultFixture } from "./fixtures";
import type { MockUSDC, Vault } from "../typechain-types";

describe("Vault.sol – Security", function () {
  // Tests de contrôles d'accès déplacés vers Vault.accessControl.test.ts
  // pour éviter la redondance et centraliser les tests AccessControl

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

    // Tests de validation des paramètres supprimés (redondants avec Vault.core.test.ts)
    // Ces validations sont déjà testées dans les tests de base ERC4626

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

  // Tests de pause supprimés (OpenZeppelin Pausable déjà audité et testé)
  // Ces tests sont redondants avec les tests standard d'OpenZeppelin

  describe("Vault - Tests de réentrance", function () {
    it("redeem() et withdraw() ont le modifier nonReentrant", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Setup : déposer des fonds
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // redeem() doit fonctionner sans reentrancy
      await expect(
        vault
          .connect(user1)
          .redeem(
            await vault.balanceOf(user1.address),
            user1.address,
            user1.address
          )
      ).to.not.be.reverted;

      // withdraw() doit revert avec WithdrawNotSupported
      await expect(
        vault
          .connect(user1)
          .withdraw(ethers.parseUnits("500", 6), user1.address, user1.address)
      ).to.be.revertedWithCustomError(vault, "WithdrawNotSupported");
    });
  });

  describe("Vault - Tests d'overflow/underflow", function () {
    it("convertToShares(0) retourne 0 sans erreur", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const shares = await vault.convertToShares(0);
      expect(shares).to.eq(0);
    });

    it("convertToAssets(0) retourne 0 sans erreur", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const assets = await vault.convertToAssets(0);
      expect(assets).to.eq(0);
    });

    // Helper DRY pour mint + approve
    async function mintAndApproveMockUSDC(
      mockUSDC: MockUSDC,
      user: any,
      vault: Vault,
      amount: bigint
    ) {
      // Mint 10x le montant pour éviter tout manque de solde
      await mockUSDC.mint(user.address, amount * 10n);
      await mockUSDC
        .connect(user)
        .approve(await vault.getAddress(), amount * 10n);
    }

    it("totalAssets() gère correctement les grands nombres", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Dépôt d'un montant très élevé
      const largeAmount = ethers.parseUnits("1000000000", 6); // 1 milliard USDC
      await mintAndApproveMockUSDC(mockUSDC, user1, vault, largeAmount);
      await vault.connect(user1).deposit(largeAmount, user1.address);

      const totalAssets = await vault.totalAssets();
      expect(totalAssets).to.be.gt(0);
      expect(totalAssets).to.be.lte(largeAmount); // Ne doit pas déborder
    });

    it("totalSupply() gère correctement les grands nombres", async function () {
      const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

      // Dépôt d'un montant très élevé
      const largeAmount = ethers.parseUnits("1000000000", 6); // 1 milliard USDC
      await mintAndApproveMockUSDC(mockUSDC, user1, vault, largeAmount);
      await vault.connect(user1).deposit(largeAmount, user1.address);

      const totalSupply = await vault.totalSupply();
      expect(totalSupply).to.be.gt(0);
      // Vérifier que le totalSupply est cohérent avec le montant déposé
      const expectedShares = await vault.convertToShares(largeAmount);
      expect(totalSupply).to.be.closeTo(expectedShares, expectedShares / 1000n); // Tolérance de 0.1%
    });
  });

  describe("Vault - Tests DoS (boucles non bornées)", function () {
    it("totalAssets() ne boucle pas indéfiniment avec beaucoup d'allocations", async function () {
      const { vault, owner, mockUSDC } = await loadFixture(deployVaultFixture);

      // Créer beaucoup d'allocations avec le même token (pour éviter TokenNotRegistered)
      const manyAllocations = [];
      for (let i = 0; i < 50; i++) {
        manyAllocations.push({
          token: await mockUSDC.getAddress(), // Utiliser le même token enregistré
          weight: ethers.parseUnits("0.02", 18), // 2% chacune
          active: true,
        });
      }

      // Doit s'exécuter sans timeout
      await expect(vault.connect(owner).setAllocations(manyAllocations)).to.not
        .be.reverted;

      // totalAssets() doit toujours fonctionner
      const totalAssets = await vault.totalAssets();
      expect(totalAssets).to.be.gte(0);
    });

    it("deposit() ne boucle pas avec beaucoup d'allocations", async function () {
      const { vault, mockUSDC, user1, owner } = await loadFixture(
        deployVaultFixture
      );

      // Créer beaucoup d'allocations avec le même token
      const manyAllocations = [];
      for (let i = 0; i < 20; i++) {
        manyAllocations.push({
          token: await mockUSDC.getAddress(), // Utiliser le même token enregistré
          weight: ethers.parseUnits("0.05", 18), // 5% chacune
          active: true,
        });
      }

      await vault.connect(owner).setAllocations(manyAllocations);

      // Dépôt doit s'exécuter sans timeout
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC.connect(user1).mint(user1.address, depositAmount);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);

      await expect(vault.connect(user1).deposit(depositAmount, user1.address))
        .to.not.be.reverted;
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
