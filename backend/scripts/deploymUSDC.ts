import { ethers } from "hardhat";

async function main() {
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();
  console.log("✅ MockUSDC déployé à:", await mockUSDC.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});