import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("TokenRegistry", function () {
  async function deployTokenRegistryFixture() {
    const [owner] = await ethers.getSigners();

    const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
    const tokenRegistry = await TokenRegistry.deploy();
    await tokenRegistry.waitForDeployment();

    return { tokenRegistry, owner };
  }

  it("enregistre un token avec nom et décimales", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const mockToken = await (
      await ethers.getContractFactory("MockUSDC")
    ).deploy("Mock USDC", "mUSDC", 6);
    const address = await mockToken.getAddress();

    await tokenRegistry.registerToken(address, "mUSDC", 6);

    expect(await tokenRegistry.isTokenRegistered(address)).to.be.true;
    expect(await tokenRegistry.getTokenDecimals(address)).to.equal(6);
  });

  it("revert si token est déjà enregistré", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const mockToken = await (
      await ethers.getContractFactory("MockUSDC")
    ).deploy("Mock USDC", "mUSDC", 6);
    const address = await mockToken.getAddress();

    await tokenRegistry.registerToken(address, "mUSDC", 6);

    await expect(
      tokenRegistry.registerToken(address, "mUSDC", 6)
    ).to.be.revertedWithCustomError(tokenRegistry, "TokenAlreadyRegistered");
  });

  it("revert si adresse est zéro", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    await expect(
      tokenRegistry.registerToken(ethers.ZeroAddress, "BAD", 18)
    ).to.be.revertedWithCustomError(tokenRegistry, "ZeroAddress");
  });

  it("revert si le symbole est vide", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();
    const token = await (
      await ethers.getContractFactory("MockUSDC")
    ).deploy("Mock USDC", "mUSDC", 6);

    await expect(
      tokenRegistry.registerToken(await token.getAddress(), "", 6)
    ).to.be.revertedWithCustomError(tokenRegistry, "InvalidSymbol");
  });

  it("revert si on demande les décimales d’un token non enregistré", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const randomAddress = ethers.Wallet.createRandom().address;
    await expect(
      tokenRegistry.getTokenDecimals(randomAddress)
    ).to.be.revertedWithCustomError(tokenRegistry, "TokenNotRegistered");
  });

  it("peut désactiver un token enregistré", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const token = await (await ethers.getContractFactory("MockGold")).deploy();
    const address = await token.getAddress();
    await tokenRegistry.registerToken(address, "mGOLD", 18);

    expect(await tokenRegistry.isTokenRegistered(address)).to.be.true;

    await tokenRegistry.setTokenActive(address, false);
    expect(await tokenRegistry.isTokenRegistered(address)).to.be.false;
  });

  it("revert si setTokenActive est appelé sur un token non enregistré", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const unknownAddress = ethers.Wallet.createRandom().address;
    await expect(
      tokenRegistry.setTokenActive(unknownAddress, true)
    ).to.be.revertedWithCustomError(tokenRegistry, "TokenNotRegistered");
  });

  it("désenregistre un token via unregisterToken()", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const token = await (
      await ethers.getContractFactory("MockUSDC")
    ).deploy("Mock USDC", "mUSDC", 6);
    const address = await token.getAddress();

    await tokenRegistry.registerToken(address, "mUSDC", 6);
    await tokenRegistry.unregisterToken(address);

    expect(await tokenRegistry.isTokenRegistered(address)).to.be.false;
  });

  it("retourne les tokens enregistrés via getRegisteredTokens()", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const token1 = await (
      await ethers.getContractFactory("MockUSDC")
    ).deploy("Mock USDC", "mUSDC", 6);
    const token2 = await (await ethers.getContractFactory("MockGold")).deploy();

    await tokenRegistry.registerToken(await token1.getAddress(), "mUSDC", 6);
    await tokenRegistry.registerToken(await token2.getAddress(), "mGOLD", 18);

    const result = await tokenRegistry.getRegisteredTokens();
    expect(result.length).to.equal(2);
    expect(result[0].symbol).to.equal("mUSDC");
    expect(result[1].symbol).to.equal("mGOLD");
  });

  it("retourne le bon nombre de tokens enregistrés avec getTokenCount()", async function () {
    const { tokenRegistry } = await deployTokenRegistryFixture();

    const token1 = await (
      await ethers.getContractFactory("MockUSDC")
    ).deploy("Mock USDC", "mUSDC", 6);
    const token2 = await (await ethers.getContractFactory("MockGold")).deploy();

    await tokenRegistry.registerToken(await token1.getAddress(), "mUSDC", 6);
    await tokenRegistry.registerToken(await token2.getAddress(), "mGOLD", 18);

    expect(await tokenRegistry.getTokenCount()).to.equal(2);
  });
});
