import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MockUSDC", function () {
  async function deployMockUSDCFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    await mockUSDC.waitForDeployment();
    return { mockUSDC, owner, user1, user2 };
  }

  it("permet à n'importe qui de mint des tokens", async function () {
    const { mockUSDC, user1, user2 } = await loadFixture(deployMockUSDCFixture);
    expect(await mockUSDC.balanceOf(user1.address)).to.equal(0);
    await mockUSDC.connect(user1).mint(user1.address, 1000e6);
    expect(await mockUSDC.balanceOf(user1.address)).to.equal(1000e6);
    await mockUSDC.connect(user2).mint(user1.address, 500e6);
    expect(await mockUSDC.balanceOf(user1.address)).to.equal(1500e6);
  });

  it("respecte les décimales personnalisées (6)", async function () {
    const { mockUSDC } = await loadFixture(deployMockUSDCFixture);
    expect(await mockUSDC.decimals()).to.equal(6);
  });
});
