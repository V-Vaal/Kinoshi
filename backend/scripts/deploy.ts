import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);

  // Déployer un mock ERC20 si besoin (ici pour local/test)
  const ERC20Mock = await ethers.getContractFactory("ERC20");
  const asset = await ERC20Mock.deploy("Mock USDC", "mUSDC");
  await asset.deployed();
  console.log("Asset ERC20 déployé à:", asset.address);

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(asset.address);
  await vault.deployed();
  console.log("Vault déployé à:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
