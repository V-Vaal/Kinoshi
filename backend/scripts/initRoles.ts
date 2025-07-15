import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.sepolia") });

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS;
  const ADMIN_ADDRESS_1 = process.env.ADMIN_ADDRESS_1;
  const USER_ADDRESS_1 = process.env.USER_ADDRESS_1;
  const USER_ADDRESS_2 = process.env.USER_ADDRESS_2;

  if (!VAULT_ADDRESS) throw new Error("VAULT_ADDRESS manquant dans .env");
  if (!ADMIN_ADDRESS_1)
    throw new Error("ADMIN_ADDRESS_1 manquant dans .env.sepolia");
  if (!USER_ADDRESS_1 || !USER_ADDRESS_2)
    throw new Error(
      "USER_ADDRESS_1 ou USER_ADDRESS_2 manquant dans .env.sepolia"
    );

  const [deployer] = await ethers.getSigners();
  console.log("Déployer:", deployer.address);

  const vault = await ethers.getContractAt("Vault", VAULT_ADDRESS);

  // Définir l'admin
  const tx1 = await vault.setAdmin(ADMIN_ADDRESS_1, true);
  await tx1.wait();
  console.log(`Admin ajouté : ${ADMIN_ADDRESS_1}`);

  // Définir les utilisateurs whitelistés
  const tx2 = await vault.setWhitelisted(USER_ADDRESS_1, true);
  await tx2.wait();
  console.log(`User whitelisté : ${USER_ADDRESS_1}`);

  const tx3 = await vault.setWhitelisted(USER_ADDRESS_2, true);
  await tx3.wait();
  console.log(`User whitelisté : ${USER_ADDRESS_2}`);

  console.log("Initialisation des rôles terminée.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
