import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployVaultFixture } from "./fixtures";
import { ethers } from "hardhat";

describe("Vault - Gestion des rôles (admin/whitelist)", function () {
  it("Le owner peut définir des admins et des whitelisted", async function () {
    const { vault, owner, user1, user2 } = await loadFixture(
      deployVaultFixture
    );

    await expect(vault.connect(owner).setAdmin(user1.address, true)).not.to.be
      .reverted;
    expect(await vault.isAdmin(user1.address)).to.be.true;

    await expect(vault.connect(owner).setWhitelisted(user2.address, true)).not
      .to.be.reverted;
    expect(await vault.isWhitelisted(user2.address)).to.be.true;

    await vault.connect(owner).setAdmin(user1.address, false);
    expect(await vault.isAdmin(user1.address)).to.be.false;
  });

  it("Les fonctions onlyAdmin bloquent les non-admins", async function () {
    const { vault, owner, user1 } = await loadFixture(deployVaultFixture);
    await vault.connect(owner).setAdmin(user1.address, true);
    expect(await vault.isAdmin(user1.address)).to.be.true;
  });

  it("Lecture correcte des mappings publics", async function () {
    const { vault, owner, user1, user2 } = await loadFixture(
      deployVaultFixture
    );
    await vault.connect(owner).setAdmin(user1.address, true);
    await vault.connect(owner).setWhitelisted(user2.address, true);
    expect(await vault.isAdmin(user1.address)).to.be.true;
    expect(await vault.isWhitelisted(user2.address)).to.be.true;
    expect(await vault.isAdmin(owner.address)).to.be.true; // owner est admin par défaut
    expect(await vault.isWhitelisted(owner.address)).to.be.false;
  });
});
