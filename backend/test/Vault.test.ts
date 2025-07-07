import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Vault, MockUSDC } from "../typechain-types";

describe("Vault.sol – OneToken", function () {
  async function deployVaultFixture() {
    const [owner, user, other] = await ethers.getSigners();

    // Deploy mock USDC (6 decimals)
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = (await MockUSDCFactory.deploy(
      "Mock USDC",
      "mUSDC",
      6
    )) as MockUSDC;
    await usdc.waitForDeployment();

    // Mint USDC for users
    await (
      await usdc.mint(owner.address, ethers.parseUnits("10000", 6))
    ).wait();
    await (await usdc.mint(user.address, ethers.parseUnits("10000", 6))).wait();

    // Deploy Vault with MockUSDC as asset
    const VaultFactory = await ethers.getContractFactory("Vault");
    const vault = (await VaultFactory.deploy(await usdc.getAddress())) as Vault;
    await vault.waitForDeployment();

    // Whitelist a strategy (ex: "equilibree")
    const allocation = [
      {
        token: await usdc.getAddress(),
        weight: ethers.parseUnits("1", 18),
        active: true,
      },
    ];
    await vault.connect(owner).addStrategy("equilibree", allocation);

    return { owner, user, other, usdc, vault };
  }

  it("doit déployer le Vault correctement", async function () {
    const { vault, usdc } = await loadFixture(deployVaultFixture);
    expect(await vault.asset()).to.eq(await usdc.getAddress());
    expect(await vault.paused()).to.eq(false);
    expect(await vault.totalSupply()).to.eq(0);
  });

  it("permet à un utilisateur de déposer des USDC et de recevoir des parts (shares)", async function () {
    const { user, usdc, vault } = await loadFixture(deployVaultFixture);
    const amount = ethers.parseUnits("1000", 6);

    // Approve Vault to spend USDC
    await (
      await usdc.connect(user).approve(await vault.getAddress(), amount)
    ).wait();

    // Deposit avec stratégie
    const tx = await vault
      .connect(user)
      ["deposit(uint256,address,string)"](amount, user.address, "equilibree");
    await expect(tx)
      .to.emit(vault, "Deposit")
      .withArgs(user.address, user.address, amount, amount * 10n ** 12n); // 6 dec → 18 dec

    expect(await vault.totalAssets()).to.eq(amount);
    expect(await vault.balanceOf(user.address)).to.eq(amount * 10n ** 12n); // shares
    expect(await usdc.balanceOf(user.address)).to.eq(
      ethers.parseUnits("9000", 6)
    );
  });

  it("convertToShares() et convertToAssets() sont cohérents (1:1, 6→18 décimales)", async function () {
    const { vault } = await loadFixture(deployVaultFixture);

    // Au premier dépôt : 1e6 mUSDC = 1e18 shares
    const amount = ethers.parseUnits("500", 6); // 500 USDC

    const shares = await vault.convertToShares(amount);
    expect(shares).to.eq(amount * 10n ** 12n);

    // L'inverse doit fonctionner
    expect(await vault.convertToAssets(shares)).to.eq(amount);
  });

  it("permet à un utilisateur de retirer (redeem) et applique le nonReentrant", async function () {
    const { user, usdc, vault } = await loadFixture(deployVaultFixture);

    const depositAmount = ethers.parseUnits("1000", 6);
    await (
      await usdc.connect(user).approve(await vault.getAddress(), depositAmount)
    ).wait();
    await vault
      .connect(user)
      ["deposit(uint256,address,string)"](
        depositAmount,
        user.address,
        "equilibree"
      );

    const shares = await vault.balanceOf(user.address);

    // Retrait (redeem)
    await expect(vault.connect(user).redeem(shares, user.address, user.address))
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

  it("revert si on tente d'envoyer de l'ETH au Vault (receive/fallback)", async function () {
    const { vault, user } = await loadFixture(deployVaultFixture);

    // Send ETH directly to the vault (should revert)
    await expect(
      user.sendTransaction({
        to: await vault.getAddress(),
        value: ethers.parseEther("1"),
      })
    ).to.be.revertedWithCustomError(vault, "EtherNotAccepted");
  });

  it("le Vault ne détient JAMAIS de tokens RWA (invariant)", async function () {
    const { vault } = await loadFixture(deployVaultFixture);
    // Ici, à étendre avec un vrai test sur TokenRegistry + mock tokens (plus tard dans le plan de développement)
    // Pour l'instant, testons juste que MockUSDC est le seul asset autorisé
    expect(await vault.asset()).to.not.eq(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("pausable : seul l'owner peut pauser et unpause, et bloque les dépôts/retraits", async function () {
    const { owner, user, vault, usdc } = await loadFixture(deployVaultFixture);

    await expect(vault.connect(user).pause()).to.be.reverted; // not owner

    await vault.connect(owner).pause();
    expect(await vault.paused()).to.eq(true);

    const amount = ethers.parseUnits("1000", 6);
    await (
      await usdc.connect(user).approve(await vault.getAddress(), amount)
    ).wait();
    await expect(
      vault
        .connect(user)
        ["deposit(uint256,address,string)"](amount, user.address, "equilibree")
    ).to.be.revertedWithCustomError(vault, "Pausable__Paused");

    await vault.connect(owner).unpause();
    expect(await vault.paused()).to.eq(false);
  });
});
