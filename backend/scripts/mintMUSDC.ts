import { ethers } from "ethers";

// 🛡️ Adresse du contrat MockUSDC déployé sur Sepolia
const mockUSDCAddress = "0x779Ac1DbfA515735584946dE0B63E7Ff5Bc7A743";

// 🛡️ Adresse du wallet qui doit recevoir le mint
const recipient = "0x88FF1addA3981367e6Da1f64E5f5e8b1c61Fd8bA";

// ✅ Clé privée du déployeur (⚠️ NE JAMAIS COMMIT EN PROD)
const privateKey =
  "0xe70f5bd8ed11022d7e8f453e4ca4a529ea15174b88f155dcdf86a2f49df2a466";

// 🔗 RPC Sepolia (Alchemy ou public)
const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/spa0bQSwKrxHU_Z1HR3AO"; // ou ton Alchemy URL ici

// 🧠 Instanciation du provider + signer
const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);

// ⚙️ Fonction principale
async function main() {
  const musdc = new ethers.Contract(
    mockUSDCAddress,
    [
      "function mint(address to, uint256 amount) external",
      "function balanceOf(address) view returns (uint256)",
    ],
    signer
  );

  const amount = ethers.parseUnits("1000", 18); // ← Montant à mint

  console.log("🚀 Envoi du mint...");
  const tx = await musdc.mint(recipient, amount);
  await tx.wait();
  console.log(
    `✅ Mint de ${ethers.formatUnits(amount)} mUSDC effectué vers ${recipient}`
  );

  const balance = await musdc.balanceOf(recipient);
  console.log(`💰 Nouveau solde : ${ethers.formatUnits(balance)} mUSDC`);
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
