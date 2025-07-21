#!/bin/bash

# Script de configuration Sepolia pour Kinoshi
# Ce script configure automatiquement l'environnement pour le déploiement Sepolia

echo "🚀 Configuration Sepolia pour Kinoshi..."

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env non trouvé à la racine du projet"
    echo "💡 Créez un fichier .env avec les variables suivantes :"
    echo "   API_KEY=your_api_key"
    echo "   RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/your_project_id"
    echo "   ETHERSCAN_API_KEY=your_etherscan_api_key"
    echo "   METAMASK_SEPOLIA_ACCOUNT_ADDRESS=your_account_address"
    echo "   PRIVATE_KEY=your_private_key"
    echo "   NEXT_PUBLIC_CHAIN_ENV=sepolia"
    echo "   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id"
    exit 1
fi

echo "✅ Fichier .env trouvé"

# Copier les variables d'environnement vers le backend
echo "📁 Configuration du backend..."
cp .env backend/.env
echo "✅ Variables d'environnement copiées vers backend/.env"

# Copier les variables d'environnement vers le frontend
echo "📁 Configuration du frontend..."
cp .env frontend/.env.local
echo "✅ Variables d'environnement copiées vers frontend/.env.local"

# Compiler les contrats backend
echo "🔨 Compilation des contrats..."
cd backend
npm run copyabis
echo "✅ ABIs copiés vers le frontend"

# Vérifier la compilation frontend
echo "🔨 Test de compilation frontend..."
cd ../frontend
npm run build
echo "✅ Frontend compilé avec succès"

echo ""
echo "🎉 Configuration Sepolia terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Déployer les contrats : cd backend && npm run deploy:sepolia"
echo "2. Mettre à jour les adresses dans frontend/constants/index.sepolia.ts"
echo "3. Lancer le frontend : cd frontend && npm run dev"
echo ""
echo "🔗 Ressources utiles :"
echo "- Faucet Sepolia : https://sepoliafaucet.com/"
echo "- Explorer Sepolia : https://sepolia.etherscan.io/"
echo "- Documentation : backend/scripts/README.sepolia.md" 