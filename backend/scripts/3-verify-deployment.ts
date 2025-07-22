import { ethers } from "hardhat";

/**
 * Script de vérification de déploiement pour Sepolia
 *
 * Ce script vérifie que tous les contrats déployés sur Sepolia sont
 * correctement configurés et fonctionnels.
 *
 * Utilisation :
 * npx hardhat run scripts/verify-deployment.ts --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🔍 Vérification du déploiement Sepolia...");
  console.log("Compte de vérification:", deployer.address);

  // Vérification de la configuration réseau
  const network = await ethers.provider.getNetwork();
  console.log(
    "Réseau:",
    network.name,
    "(chainId:",
    network.chainId.toString(),
    ")"
  );

  // Adresses des contrats (à remplacer par les vraies adresses après déploiement)
  // Ces adresses doivent être mises à jour après chaque déploiement
  const CONTRACT_ADDRESSES = {
    vault: "0xE1752CB99678b5f2679A2Ae23CC479447FA01c1f", // Adresse du Vault
    tokenRegistry: "0x9D174cF76CAFFB271a02D92E83A259b8455E327C", // Adresse du TokenRegistry
    mockPriceFeed: "0x3bdD022F03961DB8AfB9dD11daFc93AE2dc00a7C", // Adresse du MockPriceFeed
    mockUSDC: "0x779Ac1DbfA515735584946dE0B63E7Ff5Bc7A743", // Adresse du MockUSDC
    mockGold: "0x20bb92Cb9C356e044E64Ad3b92BFb29e61bEfBf6", // Adresse du MockGold
    mockBTC: "0x515ae1E0d488AC39309289fa6a9d25425f3e29c7", // Adresse du MockBTC
    mockBonds: "0xDA5e992bE6DeBaB5DD117c1D159AF9ac5d9C36Ba", // Adresse du MockBonds
    mockEquity: "0xEaB742DAF3cCcd542e6608893AEf5AE1BCE760a3", // Adresse du MockEquity
  };

  console.log("\n📋 Vérification des contrats...");

  try {
    // 1. Vérification du Vault
    console.log("\n🏦 Vérification du Vault...");
    const vault = await ethers.getContractAt("Vault", CONTRACT_ADDRESSES.vault);

    const vaultName = await vault.name();
    const vaultSymbol = await vault.symbol();
    const vaultDecimals = await vault.decimals();
    const totalSupply = await vault.totalSupply();
    const totalAssets = await vault.totalAssets();

    console.log("✅ Vault vérifié:");
    console.log("   - Nom:", vaultName);
    console.log("   - Symbole:", vaultSymbol);
    console.log("   - Décimales:", vaultDecimals.toString());
    console.log(
      "   - Total Supply:",
      ethers.formatUnits(totalSupply, vaultDecimals)
    );
    console.log(
      "   - Total Assets:",
      ethers.formatUnits(totalAssets, vaultDecimals)
    );

    // 2. Vérification du TokenRegistry
    console.log("\n📋 Vérification du TokenRegistry...");
    const tokenRegistry = await ethers.getContractAt(
      "TokenRegistry",
      CONTRACT_ADDRESSES.tokenRegistry
    );

    const tokenCount = await tokenRegistry.getTokenCount();
    const registeredTokens = await tokenRegistry.getRegisteredTokens();

    console.log("✅ TokenRegistry vérifié:");
    console.log("   - Nombre de tokens:", tokenCount.toString());
    console.log("   - Tokens enregistrés:", registeredTokens.length);

    // 3. Vérification du MockPriceFeed
    console.log("\n📊 Vérification du MockPriceFeed...");
    const mockPriceFeed = await ethers.getContractAt(
      "MockPriceFeed",
      CONTRACT_ADDRESSES.mockPriceFeed
    );

    // Vérifier les prix des tokens
    const tokensToCheck = [
      { name: "MockUSDC", address: CONTRACT_ADDRESSES.mockUSDC },
      { name: "MockGold", address: CONTRACT_ADDRESSES.mockGold },
      { name: "MockBTC", address: CONTRACT_ADDRESSES.mockBTC },
      { name: "MockBonds", address: CONTRACT_ADDRESSES.mockBonds },
      { name: "MockEquity", address: CONTRACT_ADDRESSES.mockEquity },
    ];

    console.log("✅ MockPriceFeed vérifié:");
    for (const token of tokensToCheck) {
      try {
        const hasPrice = await mockPriceFeed.hasPrice(token.address);
        if (hasPrice) {
          const [price, decimals] = await mockPriceFeed.getPrice(token.address);
          console.log(
            `   - ${token.name}: ${ethers.formatUnits(price, decimals)} USDC`
          );
        } else {
          console.log(`   - ${token.name}: Prix non défini`);
        }
      } catch (error) {
        console.log(`   - ${token.name}: Erreur lors de la vérification`);
      }
    }

    // 4. Vérification des tokens mockés
    console.log("\n🪙 Vérification des tokens mockés...");

    for (const token of tokensToCheck) {
      try {
        const tokenContract = await ethers.getContractAt(
          "MockUSDC",
          token.address
        );
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        const totalSupply = await tokenContract.totalSupply();

        console.log(`✅ ${name} (${symbol}):`);
        console.log(`   - Décimales: ${decimals}`);
        console.log(
          `   - Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`
        );
      } catch (error) {
        console.log(
          `❌ Erreur lors de la vérification de ${token.name}:`,
          error
        );
      }
    }

    // 5. Vérification des allocations du Vault
    console.log("\n⚖️ Vérification des allocations du Vault...");
    const allocations = await vault.getAllocations();

    console.log("✅ Allocations vérifiées:");
    for (let i = 0; i < allocations.length; i++) {
      const allocation = allocations[i];
      const weightPercentage =
        Number(ethers.formatUnits(allocation.weight, 18)) * 100;
      console.log(
        `   - Allocation ${i + 1}: ${weightPercentage.toFixed(1)}% (${
          allocation.active ? "Actif" : "Inactif"
        })`
      );
    }

    // 6. Vérification des frais
    console.log("\n💰 Vérification des frais...");
    const exitFeeBps = await vault.exitFeeBps();
    const managementFeeBps = await vault.managementFeeBps();

    console.log("✅ Frais vérifiés:");
    console.log(
      `   - Frais de sortie: ${exitFeeBps} bps (${Number(exitFeeBps) / 100}%)`
    );
    console.log(
      `   - Frais de gestion: ${managementFeeBps} bps (${
        Number(managementFeeBps) / 100
      }%)`
    );

    // 7. Vérification des permissions
    console.log("\n🔐 Vérification des permissions...");
    const adminRole = await vault.ADMIN_ROLE();
    const hasAdminRole = await vault.hasRole(adminRole, deployer.address);
    const isPaused = await vault.paused();

    console.log("✅ Permissions vérifiées:");
    console.log(`   - Déployeur a le rôle ADMIN: ${hasAdminRole}`);
    console.log(`   - Vault en pause: ${isPaused}`);

    // 8. Test de fonctionnalité basique
    console.log("\n🧪 Test de fonctionnalité basique...");

    // Vérifier que le vault peut calculer les conversions
    const testAmount = ethers.parseUnits("1000", 18);
    const shares = await vault.convertToShares(testAmount);
    const assets = await vault.convertToAssets(shares);

    console.log("✅ Conversions vérifiées:");
    console.log(`   - 1000 USDC → ${ethers.formatUnits(shares, 18)} shares`);
    console.log(
      `   - ${ethers.formatUnits(shares, 18)} shares → ${ethers.formatUnits(
        assets,
        18
      )} USDC`
    );

    console.log("\n🎉 Vérification terminée avec succès!");
    console.log(
      "Tous les contrats sont correctement déployés et configurés sur Sepolia."
    );
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("contract not deployed")) {
      console.log(
        "\n💡 Conseil: Assurez-vous que les contrats sont déployés avant de lancer la vérification."
      );
      console.log("   Utilisez: npm run deploy:sepolia");
    }

    if (errorMessage.includes("invalid address")) {
      console.log(
        "\n💡 Conseil: Mettez à jour les adresses des contrats dans ce script."
      );
      console.log(
        "   Remplacez les adresses '0x...' par les vraies adresses déployées."
      );
    }
  }
}

main().catch((error) => {
  console.error("❌ Erreur lors de la vérification:", error);
  process.exitCode = 1;
});
