import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Vault – Exit Fees", function () {
  async function deployVaultFixture() {
    const [owner, user1, treasury] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6);
    await mockUSDC.waitForDeployment();

    await mockUSDC.mint(owner.address, ethers.parseUnits("10000", 6));
    await mockUSDC.mint(user1.address, ethers.parseUnits("10000", 6));

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(
      await mockUSDC.getAddress(),
      "Équilibrée",
      treasury.address
    );
    await vault.waitForDeployment();

    const allocation = [
      {
        token: await mockUSDC.getAddress(),
        weight: ethers.parseUnits("1", 18),
        active: true,
      },
    ];

    await vault.connect(owner).setAllocations(allocation);

    return { vault, mockUSDC, owner, user1, treasury };
  }

  it("permet à l'owner de modifier le exitFeeBps", async function () {
    const { vault, owner } = await loadFixture(deployVaultFixture);

    const newFee = 300;
    await vault.connect(owner).setExitFeeBps(newFee);
    expect(await vault.exitFeeBps()).to.equal(newFee);
  });

  it("revert si un non-owner tente de modifier les frais", async function () {
    const { vault, user1 } = await loadFixture(deployVaultFixture);

    await expect(
      vault.connect(user1).setExitFeeBps(100)
    ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
  });

  it("revert si on dépasse la limite MAX_FEE_BPS", async function () {
    const { vault, owner } = await loadFixture(deployVaultFixture);

    await expect(
      vault.connect(owner).setExitFeeBps(1001)
    ).to.be.revertedWith("Fee exceeds maximum");
  });

  it("n’applique pas de frais si exitFeeBps == 0", async function () {
    const { vault, mockUSDC, user1 } = await loadFixture(deployVaultFixture);

    const depositAmount = ethers.parseUnits("1000", 6);
    await mockUSDC.connect(user1).approve(vault, depositAmount);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    const shares = await vault.balanceOf(user1.address);
    const redeemShares = shares / 2n;

    const treasuryBalanceBefore = await mockUSDC.balanceOf(
      (await vault.treasury())
    );

    await vault
      .connect(user1)
      .redeem(redeemShares, user1.address, user1.address);

    const treasuryBalanceAfter = await mockUSDC.balanceOf(
      (await vault.treasury())
    );

    expect(treasuryBalanceAfter - treasuryBalanceBefore).to.eq(0);
  });

  it("calcule et applique correctement les frais avec exitFeeBps > 0", async function () {
    const { vault, mockUSDC, user1, treasury, owner } = await loadFixture(
      deployVaultFixture
    );

    await vault.connect(owner).setExitFeeBps(500); // 5%

    const depositAmount = ethers.parseUnits("1000", 6);
    await mockUSDC.connect(user1).approve(vault, depositAmount);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    const treasuryBefore = await mockUSDC.balanceOf(treasury.address);
    const userBefore = await mockUSDC.balanceOf(user1.address);

    const shares = await vault.balanceOf(user1.address);
    const redeemShares = shares / 2n;

    const expectedAssets = depositAmount / 2n;
    const expectedFee = (expectedAssets * 500n) / 10_000n;
    const expectedAfterFee = expectedAssets - expectedFee;

    await expect(
      vault.connect(user1).redeem(redeemShares, user1.address, user1.address)
    )
      .to.emit(vault, "ExitFeeApplied")
      .withArgs(user1.address, expectedAssets, expectedFee);

    const treasuryAfter = await mockUSDC.balanceOf(treasury.address);
    const userAfter = await mockUSDC.balanceOf(user1.address);

    expect(treasuryAfter - treasuryBefore).to.eq(expectedFee);
    expect(userAfter - userBefore).to.eq(expectedAfterFee);
  });
});
