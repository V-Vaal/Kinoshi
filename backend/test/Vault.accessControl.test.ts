import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployVaultFixture } from "./fixtures";

describe("Vault – AccessControl", function () {
  describe("Rôles et permissions", function () {
    it("déploie avec le bon owner comme DEFAULT_ADMIN_ROLE et ADMIN_ROLE", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const defaultAdminRole = await vault.DEFAULT_ADMIN_ROLE();
      const adminRole = await vault.ADMIN_ROLE();

      expect(await vault.hasRole(defaultAdminRole, owner.address)).to.be.true;
      expect(await vault.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("permet au DEFAULT_ADMIN_ROLE de gérer les rôles", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      const adminRole = await vault.ADMIN_ROLE();

      // Grant ADMIN_ROLE à user1
      await vault.connect(owner).setAdmin(user1.address, true);
      expect(await vault.hasRole(adminRole, user1.address)).to.be.true;

      // Revoke ADMIN_ROLE de user1
      await vault.connect(owner).setAdmin(user1.address, false);
      expect(await vault.hasRole(adminRole, user1.address)).to.be.false;
    });

    it("reject si un non-DEFAULT_ADMIN tente de gérer les rôles", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setAdmin(user1.address, true)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Fonctions DEFAULT_ADMIN_ROLE", function () {
    it("seul le DEFAULT_ADMIN_ROLE peut pauser/unpause", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      // Test pause
      await expect(vault.connect(user1).pause()).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );
      await vault.connect(owner).pause();
      expect(await vault.paused()).to.be.true;

      // Test unpause
      await expect(
        vault.connect(user1).unpause()
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );
      await vault.connect(owner).unpause();
      expect(await vault.paused()).to.be.false;
    });

    it("seul le DEFAULT_ADMIN_ROLE peut définir le feeReceiver", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setFeeReceiver(user1.address)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      await vault.connect(owner).setFeeReceiver(user1.address);
      expect(await vault.feeReceiver()).to.eq(user1.address);
    });

    it("seul le DEFAULT_ADMIN_ROLE peut bootstrap le Vault", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).bootstrapVault()
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Fonctions ADMIN_ROLE", function () {
    it("seul un ADMIN_ROLE peut modifier les allocations", async function () {
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
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      await vault.connect(owner).setAllocations(newAllocations);
    });

    it("seul un ADMIN_ROLE peut modifier les frais", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(user1).setFees(100, 50)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      await vault.connect(owner).setFees(100, 50);
      expect(await vault.exitFeeBps()).to.eq(100);
      expect(await vault.managementFeeBps()).to.eq(50);
    });

    it("seul un ADMIN_ROLE peut accrue des frais de gestion", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).setFeeReceiver(user1.address);
      const feeShares = ethers.parseUnits("1000", 18);

      await expect(
        vault.connect(user1).accrueManagementFee(feeShares)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      await vault.connect(owner).accrueManagementFee(feeShares);
    });

    it("seul un ADMIN_ROLE peut programmer les frais", async function () {
      const { vault, owner, user1, mockUSDC } = await loadFixture(
        deployVaultFixture
      );

      // Setup pour scheduleManagementFee
      await vault.connect(owner).setFeeReceiver(owner.address);
      await vault.connect(owner).setFees(50, 100);

      const depositAmount = ethers.parseUnits("1000", 18);
      await mockUSDC
        .connect(user1)
        .approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      await expect(
        vault.connect(user1).scheduleManagementFee()
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      await vault.connect(owner).scheduleManagementFee();
    });

    it("seul un ADMIN_ROLE peut accrue des frais de gestion manuellement", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).setFeeReceiver(user1.address);
      await vault.connect(owner).setFees(50, 100);

      const feeShares = ethers.parseUnits("1000", 18);

      await expect(
        vault.connect(user1).accrueManagementFee(feeShares)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      await vault.connect(owner).accrueManagementFee(feeShares);
    });

    it("seul un ADMIN_ROLE peut accéder aux fonctions de gestion", async function () {
      const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

      // Test que user1 ne peut pas accéder aux fonctions admin
      await expect(
        vault.connect(user1).setAllocations([])
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );

      await expect(
        vault.connect(user1).setFees(100, 50)
      ).to.be.revertedWithCustomError(
        vault,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Multi-admin support", function () {
    it("permet à plusieurs admins d'exécuter des fonctions admin", async function () {
      const { vault, owner, user1, user2 } = await loadFixture(
        deployVaultFixture
      );

      // Ajouter user1 comme admin
      await vault.connect(owner).setAdmin(user1.address, true);
      await vault.connect(owner).setAdmin(user2.address, true);

      // user1 peut modifier les frais
      await vault.connect(user1).setFees(200, 100);
      expect(await vault.exitFeeBps()).to.eq(200);

      // user2 peut modifier les allocations
      const newAllocations = [
        {
          token: await vault.asset(),
          weight: ethers.parseUnits("1", 18),
          active: true,
        },
      ];
      await vault.connect(user2).setAllocations(newAllocations);

      // Retirer les rôles
      await vault.connect(owner).setAdmin(user1.address, false);
      await vault.connect(owner).setAdmin(user2.address, false);

      // Vérifier que les rôles ont été retirés
      const adminRole = await vault.ADMIN_ROLE();
      expect(await vault.hasRole(adminRole, user1.address)).to.be.false;
      expect(await vault.hasRole(adminRole, user2.address)).to.be.false;
    });
  });
});
