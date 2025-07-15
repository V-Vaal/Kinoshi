import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseUnits } from "ethers";

describe("Vault - Allocation RWA lors du dépôt", function () {
  async function deployFixture() {
    const [owner, user, treasury] = await ethers.getSigners();
    // Déploiement des tokens mocks
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    const mBTC = await MockUSDC.deploy("Mock BTC", "mBTC", 8);
    const mBcSPX = await MockUSDC.deploy("Mock BcSPX", "mBcSPX", 18);
    const mPAXG = await MockUSDC.deploy("Mock PAXG", "mPAXG", 18);
    const mUSDS = await MockUSDC.deploy("Mock USDS", "mUSDS", 18);
    await Promise.all([
      mUSDC.waitForDeployment(),
      mBTC.waitForDeployment(),
      mBcSPX.waitForDeployment(),
      mPAXG.waitForDeployment(),
      mUSDS.waitForDeployment(),
    ]);
    // Registry
    const TokenRegistry = await ethers.getContractFactory("TokenRegistry");
    const registry = await TokenRegistry.deploy();
    await registry.waitForDeployment();
    await registry.registerToken(await mUSDC.getAddress(), "mUSDC", 6);
    await registry.registerToken(await mBTC.getAddress(), "mBTC", 8);
    await registry.registerToken(await mBcSPX.getAddress(), "mBcSPX", 18);
    await registry.registerToken(await mPAXG.getAddress(), "mPAXG", 18);
    await registry.registerToken(await mUSDS.getAddress(), "mUSDS", 18);
    // Oracle mock
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy(owner.address);
    await mockPriceFeed.waitForDeployment();
    // Vault
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(
      await mUSDC.getAddress(),
      "Équilibrée",
      treasury.address,
      registry.getAddress(),
      mockPriceFeed.getAddress()
    );
    await vault.waitForDeployment();
    // Allocation "Équilibrée"
    const allocations = [
      {
        token: await mUSDS.getAddress(),
        weight: parseUnits("0.35", 18),
        active: true,
      },
      {
        token: await mBcSPX.getAddress(),
        weight: parseUnits("0.30", 18),
        active: true,
      },
      {
        token: await mPAXG.getAddress(),
        weight: parseUnits("0.20", 18),
        active: true,
      },
      {
        token: await mBTC.getAddress(),
        weight: parseUnits("0.15", 18),
        active: true,
      },
    ];
    await vault.connect(owner).setAllocations(allocations);
    // Mint mUSDC à user
    await mUSDC.mint(user.address, 1000e6);
    // Approve
    await mUSDC.connect(user).approve(vault.getAddress(), 1000e6);
    return { vault, mUSDC, mBTC, mBcSPX, mPAXG, mUSDS, user, allocations };
  }

  it("répartit bien les tokens mock selon la pondération lors d'un dépôt", async function () {
    const { vault, mUSDC, mBTC, mBcSPX, mPAXG, mUSDS, user, allocations } =
      await loadFixture(deployFixture);
    const depositAmount = 1000e6;
    await expect(
      vault.connect(user).deposit(depositAmount, user.address)
    ).to.emit(vault, "Allocated");
    // Vérifie les soldes du Vault pour chaque token
    // mUSDS (18)
    const expectedUSDS = BigInt(Math.floor(depositAmount * 0.35 * 1e12)); // 6->18
    expect(await mUSDS.balanceOf(vault.getAddress())).to.equal(expectedUSDS);
    // mBcSPX (18)
    const expectedBcSPX = BigInt(Math.floor(depositAmount * 0.3 * 1e12));
    expect(await mBcSPX.balanceOf(vault.getAddress())).to.equal(expectedBcSPX);
    // mPAXG (18)
    const expectedPAXG = BigInt(Math.floor(depositAmount * 0.2 * 1e12));
    expect(await mPAXG.balanceOf(vault.getAddress())).to.equal(expectedPAXG);
    // mBTC (8)
    const expectedBTC = BigInt(Math.floor(depositAmount * 0.15 * 1e2)); // 6->8
    expect(await mBTC.balanceOf(vault.getAddress())).to.equal(expectedBTC);
    // Vérifie que l'utilisateur a bien reçu ses shares
    expect(await vault.balanceOf(user.address)).to.be.gt(0);
  });
});
