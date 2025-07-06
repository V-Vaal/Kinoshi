import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Vault", function () {
  async function deployVaultFixture() {
    const [owner] = await ethers.getSigners();
    const ERC20Mock = await ethers.getContractFactory("ERC20");
    const asset = await ERC20Mock.deploy("Mock USDC", "mUSDC");
    await asset.deployed();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(asset.address);
    await vault.deployed();
    return { vault, asset, owner };
  }

  it("doit déployer le Vault correctement", async function () {
    const { vault, asset } = await loadFixture(deployVaultFixture);
    expect(await vault.asset()).to.equal(asset.address);
  });
}); 