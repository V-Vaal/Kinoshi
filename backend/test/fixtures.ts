import { ethers } from "hardhat";
import { parseUnits } from "ethers";


export async function deployVaultFixture() {
  const [owner, user1, user2] = await ethers.getSigners();

  // Déploiement du MockUSDC (6 décimales)
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const mockUSDC = await ERC20Mock.deploy("Mock USDC", "mUSDC", 6);
  // Déploiement du Vault
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(await mockUSDC.getAddress());
  // Définition d'une stratégie fictive "equilibree"
  const strategyId = "equilibree";
  const allocations = [
    {
      token: await mockUSDC.getAddress(),
      weight: parseUnits("1", 18), // 100% sur mUSDC
      active: true,
    },
  ];
  // Ajout de la stratégie (owner only)
  await vault.connect(owner).addStrategy(strategyId, allocations);

  return { vault, mockUSDC, owner, user1, user2, strategyId };
} 