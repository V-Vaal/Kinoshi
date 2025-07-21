#!/bin/bash

# Script de mise à jour des adresses de contrats après déploiement Sepolia
# Ce script met à jour automatiquement les fichiers de configuration avec les vraies adresses

echo "🔄 Mise à jour des adresses de contrats..."

# Vérifier que le fichier de déploiement existe
DEPLOYMENT_FILE="backend/deployment-sepolia.json"
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo "❌ Fichier de déploiement $DEPLOYMENT_FILE non trouvé"
    echo "💡 Déployez d'abord les contrats avec : cd backend && npm run deploy:sepolia"
    exit 1
fi

echo "✅ Fichier de déploiement trouvé"

# Lire les adresses depuis le fichier de déploiement
VAULT_ADDRESS=$(jq -r '.vault' "$DEPLOYMENT_FILE")
TOKEN_REGISTRY_ADDRESS=$(jq -r '.tokenRegistry' "$DEPLOYMENT_FILE")
MOCK_ORACLE_ADDRESS=$(jq -r '.mockPriceFeed' "$DEPLOYMENT_FILE")
MOCK_USDC_ADDRESS=$(jq -r '.mockUSDC' "$DEPLOYMENT_FILE")
MOCK_GOLD_ADDRESS=$(jq -r '.mockGold' "$DEPLOYMENT_FILE")
MOCK_BTC_ADDRESS=$(jq -r '.mockBTC' "$DEPLOYMENT_FILE")
MOCK_BONDS_ADDRESS=$(jq -r '.mockBonds' "$DEPLOYMENT_FILE")
MOCK_EQUITY_ADDRESS=$(jq -r '.mockEquity' "$DEPLOYMENT_FILE")

echo "📋 Adresses récupérées :"
echo "   Vault: $VAULT_ADDRESS"
echo "   TokenRegistry: $TOKEN_REGISTRY_ADDRESS"
echo "   MockPriceFeed: $MOCK_ORACLE_ADDRESS"
echo "   MockUSDC: $MOCK_USDC_ADDRESS"
echo "   MockGold: $MOCK_GOLD_ADDRESS"
echo "   MockBTC: $MOCK_BTC_ADDRESS"
echo "   MockBonds: $MOCK_BONDS_ADDRESS"
echo "   MockEquity: $MOCK_EQUITY_ADDRESS"

# Mettre à jour le fichier constants/index.sepolia.ts
echo "📝 Mise à jour de frontend/constants/index.sepolia.ts..."

cat > frontend/constants/index.sepolia.ts << EOF
// constants/index.sepolia.ts

// 🔐 Adresses des contrats déployés sur Sepolia
// 💡 Généré automatiquement par le script de déploiement Sepolia
// 📝 Configuration spécifique au réseau de test Sepolia

export const vaultAddress = "$VAULT_ADDRESS";
export const tokenRegistryAddress = "$TOKEN_REGISTRY_ADDRESS";

export const mockTokenAddresses = {
  mUSDC: "$MOCK_USDC_ADDRESS",
  mGOLD: "$MOCK_GOLD_ADDRESS",
  mBTC: "$MOCK_BTC_ADDRESS",
  mBONDS: "$MOCK_BONDS_ADDRESS",
  mEQUITY: "$MOCK_EQUITY_ADDRESS"
};

export const mockOracleAddress = "$MOCK_ORACLE_ADDRESS";

// Configuration réseau Sepolia
export const networkConfig = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || "https://sepolia.infura.io/v3/your-project-id",
  explorer: "https://sepolia.etherscan.io"
};

// Configuration des prix pour Sepolia (en USDC)
export const priceConfig = {
  BTC: 45000, // \$45,000
  GOLD: 2000, // \$2,000
  EQUITY: 150, // \$150
  BONDS: 100, // \$100
  USDC: 1 // \$1.00
};

// Configuration de la stratégie d'allocation pour Sepolia
export const allocationConfig = {
  GOLD: 0.25, // 25%
  BTC: 0.20, // 20%
  BONDS: 0.30, // 30%
  EQUITY: 0.25 // 25%
};

// Configuration des frais pour Sepolia
export const feeConfig = {
  exitFee: 0.005, // 0.5%
  managementFee: 0 // 0%
};
EOF

echo "✅ frontend/constants/index.sepolia.ts mis à jour"

# Mettre à jour le fichier .env racine avec les nouvelles adresses
echo "📝 Mise à jour du fichier .env racine..."

# Sauvegarder le fichier .env original
cp .env .env.backup

# Mettre à jour les adresses dans le fichier .env
sed -i "s/NEXT_PUBLIC_VAULT_ADDRESS=.*/NEXT_PUBLIC_VAULT_ADDRESS=$VAULT_ADDRESS/" .env
sed -i "s/NEXT_PUBLIC_TOKEN_REGISTRY_ADDRESS=.*/NEXT_PUBLIC_TOKEN_REGISTRY_ADDRESS=$TOKEN_REGISTRY_ADDRESS/" .env
sed -i "s/NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=.*/NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=$MOCK_ORACLE_ADDRESS/" .env
sed -i "s/NEXT_PUBLIC_MOCK_USDC_ADDRESS=.*/NEXT_PUBLIC_MOCK_USDC_ADDRESS=$MOCK_USDC_ADDRESS/" .env
sed -i "s/NEXT_PUBLIC_MOCK_GOLD_ADDRESS=.*/NEXT_PUBLIC_MOCK_GOLD_ADDRESS=$MOCK_GOLD_ADDRESS/" .env
sed -i "s/NEXT_PUBLIC_MOCK_BTC_ADDRESS=.*/NEXT_PUBLIC_MOCK_BTC_ADDRESS=$MOCK_BTC_ADDRESS/" .env
sed -i "s/NEXT_PUBLIC_MOCK_BONDS_ADDRESS=.*/NEXT_PUBLIC_MOCK_BONDS_ADDRESS=$MOCK_BONDS_ADDRESS/" .env
sed -i "s/NEXT_PUBLIC_MOCK_EQUITY_ADDRESS=.*/NEXT_PUBLIC_MOCK_EQUITY_ADDRESS=$MOCK_EQUITY_ADDRESS/" .env

echo "✅ Fichier .env racine mis à jour"

# Copier les variables mises à jour vers le frontend
cp .env frontend/.env.local
echo "✅ Variables d'environnement copiées vers frontend/.env.local"

# Tester la compilation frontend
echo "🔨 Test de compilation frontend..."
cd frontend
npm run build
echo "✅ Frontend compilé avec succès"

echo ""
echo "🎉 Mise à jour des adresses terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Lancer le frontend : cd frontend && npm run dev"
echo "2. Tester les fonctionnalités sur Sepolia"
echo "3. Vérifier les contrats sur Etherscan"
echo ""
echo "🔗 Liens utiles :"
echo "- Vault: https://sepolia.etherscan.io/address/$VAULT_ADDRESS"
echo "- TokenRegistry: https://sepolia.etherscan.io/address/$TOKEN_REGISTRY_ADDRESS"
echo "- MockPriceFeed: https://sepolia.etherscan.io/address/$MOCK_ORACLE_ADDRESS" 