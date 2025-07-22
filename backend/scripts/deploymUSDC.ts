import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();
  console.log("✅ MockUSDC déployé à:", await mockUSDC.getAddress());
  try {
    await hre.run("verify:verify", {
      address: await mockUSDC.getAddress(),
      constructorArguments: ["Mock USDC", "mUSDC"],
    });
    console.log("✅ Contrat MockUSDC vérifié sur Etherscan");
  } catch (error) {
    console.error("❌ Erreur lors de la vérification de MockUSDC:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
