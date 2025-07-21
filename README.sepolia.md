# Déploiement Sepolia - Kinoshi

Guide complet pour déployer et configurer Kinoshi sur le réseau de test Sepolia.

## 🚀 Déploiement Rapide

### 1. Configuration automatique

```bash
# Configuration automatique de l'environnement
./scripts/setup-sepolia.sh
```

### 2. Déploiement des contrats

```bash
# Déploiement sur Sepolia
cd backend
npm run deploy:sepolia
```

### 3. Mise à jour des adresses

```bash
# Mise à jour automatique des adresses
./scripts/update-addresses.sh
```

### 4. Lancement du frontend

```bash
# Lancement en mode développement
cd frontend
npm run dev
```

## 📋 Prérequis

### Variables d'environnement

Assurez-vous que votre fichier `.env` à la racine contient :

```env
# Configuration Sepolia
API_KEY=your_api_key
RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
METAMASK_SEPOLIA_ACCOUNT_ADDRESS=your_account_address
PRIVATE_KEY=your_private_key
NEXT_PUBLIC_CHAIN_ENV=sepolia
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### ETH Sepolia

Obtenez des ETH Sepolia via :
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

## 🔧 Configuration Manuelle

### Backend

```bash
cd backend

# Compilation des contrats
npx hardhat compile

# Copie des ABIs
npm run copyabis

# Déploiement
npm run deploy:sepolia

# Vérification
npx hardhat run scripts/verify-deployment.ts --network sepolia
```

### Frontend

```bash
cd frontend

# Installation des dépendances
npm install

# Test de compilation
npm run build

# Lancement en développement
npm run dev
```

## 📁 Structure des Fichiers

```
Kinoshi/
├── .env                          # Variables d'environnement racine
├── scripts/
│   ├── setup-sepolia.sh         # Configuration automatique
│   └── update-addresses.sh      # Mise à jour des adresses
├── backend/
│   ├── scripts/
│   │   ├── deploy.sepolia.ts    # Script de déploiement Sepolia
│   │   ├── verify-deployment.ts # Vérification du déploiement
│   │   └── README.sepolia.md    # Documentation backend
│   └── deployment-sepolia.json  # Adresses des contrats déployés
└── frontend/
    ├── constants/
    │   └── index.sepolia.ts     # Configuration frontend Sepolia
    ├── lib/
    │   ├── config.ts            # Configuration principale
    │   └── wagmi.sepolia.ts     # Configuration Wagmi Sepolia
    └── README.sepolia.md        # Documentation frontend
```

## 🔍 Vérification

### Contrats déployés

Après déploiement, vérifiez les contrats sur Etherscan Sepolia :

- **Vault** : Gestionnaire principal du portefeuille
- **TokenRegistry** : Registre des tokens autorisés
- **MockPriceFeed** : Oracle de prix pour les tests
- **MockUSDC** : Token stable pour les dépôts
- **MockGold, MockBTC, MockBonds, MockEquity** : Tokens d'actifs

### Tests fonctionnels

1. **Connexion wallet** : Vérifiez la connexion au réseau Sepolia
2. **Lecture contrats** : Testez l'affichage des prix et allocations
3. **Dépôt** : Effectuez un petit dépôt (quelques USDC)
4. **Allocation** : Vérifiez l'allocation automatique
5. **Retrait** : Testez un retrait avec frais

## 🛠️ Scripts Utiles

### Configuration automatique

```bash
# Configuration complète de l'environnement
./scripts/setup-sepolia.sh
```

### Mise à jour des adresses

```bash
# Après déploiement, met à jour automatiquement les adresses
./scripts/update-addresses.sh
```

### Vérification du déploiement

```bash
# Vérifie que tous les contrats sont correctement déployés
cd backend
npx hardhat run scripts/verify-deployment.ts --network sepolia
```

## 🔗 Ressources

### Réseau Sepolia

- **Explorer** : https://sepolia.etherscan.io/
- **Faucet** : https://sepoliafaucet.com/
- **Documentation** : https://docs.sepolia.org/

### Outils de développement

- **Hardhat** : https://hardhat.org/
- **Wagmi** : https://wagmi.sh/
- **Next.js** : https://nextjs.org/

## 🚨 Dépannage

### Erreurs courantes

#### "insufficient funds for gas"
```bash
# Obtenez des ETH Sepolia
curl -X POST https://sepoliafaucet.com/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_ADDRESS"}'
```

#### "contract not found"
```bash
# Vérifiez les adresses dans le fichier de déploiement
cat backend/deployment-sepolia.json
```

#### "wrong network"
```bash
# Basculez vers Sepolia dans votre wallet
# ChainId: 11155111
```

#### "RPC URL not configured"
```bash
# Vérifiez votre fichier .env
cat .env | grep RPC_URL_SEPOLIA
```

### Logs utiles

```bash
# Logs de compilation
cd backend && npx hardhat compile --verbose

# Logs de déploiement
cd backend && npm run deploy:sepolia

# Logs frontend
cd frontend && npm run dev
```

## 📞 Support

Pour toute question ou problème :

1. Vérifiez les logs de compilation et déploiement
2. Consultez la documentation dans `backend/scripts/README.sepolia.md`
3. Vérifiez la configuration des variables d'environnement
4. Testez d'abord sur le réseau local

## 🔄 Workflow de Développement

1. **Développement local** : Testez sur Hardhat local
2. **Test Sepolia** : Déployez et testez sur Sepolia
3. **Production** : Déployez sur le réseau principal

## 📝 Notes

- Les contrats sur Sepolia sont des versions de test
- Les tokens sont mockés pour les tests
- Les prix sont configurés de manière réaliste
- Les frais sont réduits pour les tests
- Toutes les adresses sont automatiquement mises à jour 