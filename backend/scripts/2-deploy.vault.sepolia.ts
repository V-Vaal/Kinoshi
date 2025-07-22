import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

// À adapter : importer ou copier-coller les adresses générées par le script mocks
import {
  mockTokenAddresses,
  tokenRegistryAddress,
  mockOracleAddress,
} from "../../frontend/constants/mocks.sepolia";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Déploiement du Vault avec le compte:", deployer.address);

  // Déploiement du Vault
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    mockTokenAddresses.mUSDC, // token sous-jacent
    "Équilibrée Sepolia", // label de la stratégie
    "0x88FF1addA3981367e6Da1f64E5f5e8b1c61Fd8bA", // treasury (à adapter si besoin)
    tokenRegistryAddress,
    mockOracleAddress
  );
  await vault.waitForDeployment();

  // Génération du fichier de constantes pour le frontend
  const frontendConstantsPath = join(
    __dirname,
    "../../frontend/constants/vault.sepolia.ts"
  );
  const constantsContent = `// vault.sepolia.ts\n\nexport const vaultAddress = "${await vault.getAddress()}";\nexport const treasuryAddress = "0x88FF1addA3981367e6Da1f64E5f5e8b1c61Fd8bA";\n`;
  writeFileSync(frontendConstantsPath, constantsContent, "utf-8");
  console.log("✅ Fichier frontend/constants/vault.sepolia.ts généré");
  console.log("✅ Vault déployé à:", await vault.getAddress());
  console.log("\n🎯 Adresse du Vault:", await vault.getAddress());
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement du Vault:", error);
  process.exitCode = 1;
});
