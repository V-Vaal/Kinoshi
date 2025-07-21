import { copyFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Script de copie des ABIs des contrats vers le frontend
 *
 * Ce script copie tous les fichiers ABI depuis backend/artifacts/contracts/
 * vers frontend/abis/ pour permettre au frontend d'interagir avec les contrats.
 *
 * Les ABIs sont nécessaires pour :
 * - Créer les instances de contrats dans le frontend
 * - Interagir avec les fonctions des smart contracts
 * - Afficher les interfaces utilisateur appropriées
 */
async function main() {
  console.log("🔄 Copie des ABIs vers le frontend...");

  // Chemins source et destination
  const backendArtifactsPath = join(__dirname, "../artifacts/contracts");
  const frontendAbisPath = join(__dirname, "../../frontend/abis");

  // Vérifier que le dossier artifacts existe
  if (!existsSync(backendArtifactsPath)) {
    console.error(
      "❌ Dossier artifacts non trouvé. Compilez d'abord les contrats avec 'npx hardhat compile'"
    );
    process.exit(1);
  }

  // Créer le dossier abis s'il n'existe pas
  if (!existsSync(frontendAbisPath)) {
    console.log("📁 Création du dossier frontend/abis...");
    mkdirSync(frontendAbisPath, { recursive: true });
  }

  // Liste des contrats à copier
  const contractsToCopy = [
    "Vault.sol/Vault",
    "TokenRegistry.sol/TokenRegistry",
    "MockPriceFeed.sol/MockPriceFeed",
    "mocks/MockUSDC.sol/MockUSDC",
    "mocks/MockGold.sol/MockGold",
    "mocks/MockBTC.sol/MockBTC",
    "mocks/MockBonds.sol/MockBonds",
    "mocks/MockEquity.sol/MockEquity",
  ];

  let copiedCount = 0;
  let errorCount = 0;

  for (const contractPath of contractsToCopy) {
    try {
      const pathParts = contractPath.split("/");
      const contractName = pathParts[pathParts.length - 1];
      const contractFile = pathParts.slice(0, -1).join("/");

      const sourcePath = join(
        backendArtifactsPath,
        contractFile,
        `${contractName}.json`
      );
      const destPath = join(frontendAbisPath, `${contractName}.abi.json`);

      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
        console.log(`✅ ${contractName}.abi.json copié`);
        copiedCount++;
      } else {
        console.log(
          `⚠️  ${contractName} non trouvé dans artifacts (${sourcePath})`
        );
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la copie de ${contractPath}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   - ABIs copiés: ${copiedCount}`);
  console.log(`   - Erreurs: ${errorCount}`);

  if (errorCount === 0) {
    console.log("🎉 Tous les ABIs ont été copiés avec succès!");
  } else {
    console.log(
      "⚠️  Certains ABIs n'ont pas pu être copiés. Vérifiez la compilation."
    );
  }
}

main().catch((error) => {
  console.error("❌ Erreur lors de la copie des ABIs:", error);
  process.exit(1);
});
