# Déploiement Sepolia - Kinoshi

Ce guide explique comment déployer les contrats Kinoshi sur le réseau de test Sepolia.

## Prérequis

### 1. Configuration environnement

Créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes :

```env
# Configuration réseau Sepolia
RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here

# Clé API Etherscan pour la vérification des contrats
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 2. Obtenir des ETH Sepolia

Vous aurez besoin d'ETH Sepolia pour payer les frais de gas. Vous pouvez en obtenir gratuitement via :

- **Alchemy Sepolia Faucet** : https://sepoliafaucet.com/
- **Infura Sepolia Faucet** : https://www.infura.io/faucet/sepolia
- **Chainlink Faucet** : https://faucets.chain.link/sepolia

### 3. Compte de déploiement

Assurez-vous que votre compte de déploiement a suffisamment d'ETH Sepolia (au moins 0.1 ETH recommandé).

## Déploiement

### Méthode 1 : Script npm (recommandé)

```bash
cd backend
npm run deploy:sepolia
```

### Méthode 2 : Commande directe

```bash
cd backend
npx hardhat run scripts/deploy.sepolia.ts --network sepolia
```

## Configuration spécifique Sepolia

### Prix des actifs

Le script configure des prix pour Sepolia :

- **BTC** : $45,000 USDC
- **Equity** : $150 USDC
- **Gold** : $2,000 USDC
- **Bonds** : $100 USDC
- **USDC** : $1.00 USDC

### Stratégie d'allocation

Allocation équilibrée pour Sepolia :

- **Or (Gold)** : 25%
- **Bitcoin (BTC)** : 20%
- **Obligations (Bonds)** : 30%
- **Actions (Equity)** : 25%

### Frais

- **Frais de sortie** : 0.5% (50 basis points)
- **Frais de gestion** : 0% (pour les tests)

## Vérification des contrats

### Vérification automatique

Après le déploiement, le script affiche les commandes de vérification. Exemple :

```bash
# Vérifier le Vault
npx hardhat verify --network sepolia 0x... "0x..." "Équilibrée Sepolia" "0x..." "0x..." "0x..."

# Vérifier le TokenRegistry
npx hardhat verify --network sepolia 0x...

# Vérifier le MockPriceFeed
npx hardhat verify --network sepolia 0x... "0x..."
```

### Vérification manuelle

Vous pouvez également vérifier manuellement sur Etherscan Sepolia :

1. Allez sur https://sepolia.etherscan.io/
2. Recherchez l'adresse du contrat
3. Cliquez sur "Contract" → "Verify and Publish"
4. Suivez les instructions

## Fichiers générés

### Frontend constants

Le script génère automatiquement `frontend/constants/index.sepolia.ts` avec :

- Adresses de tous les contrats déployés
- Configuration réseau Sepolia
- Adresses des tokens mockés

### Utilisation dans le frontend

Pour utiliser les contrats Sepolia dans le frontend :

```typescript
import { vaultAddress, mockTokenAddresses } from "../constants/index.sepolia";

// Configuration wagmi pour Sepolia
const config = {
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA),
  },
};
```

## Tests post-déploiement

### 1. Vérification des contrats

```bash
# Vérifier que tous les contrats sont déployés
npx hardhat run scripts/verify-deployment.ts --network sepolia
```

### 2. Tests d'intégration

```bash
# Lancer les tests sur Sepolia
npx hardhat test --network sepolia
```

### 3. Tests manuels

1. Connectez-vous au frontend configuré pour Sepolia
2. Testez le dépôt de fonds
3. Vérifiez l'allocation automatique
4. Testez le retrait avec frais

## Dépannage

### Erreurs courantes

#### "insufficient funds for gas"

- **Solution** : Obtenez plus d'ETH Sepolia via un faucet

#### "nonce too low"

- **Solution** : Attendez quelques minutes ou réinitialisez le nonce

#### "contract verification failed"

- **Solution** : Vérifiez les arguments du constructeur et réessayez

#### "RPC URL not configured"

- **Solution** : Vérifiez votre fichier `.env` et la variable `RPC_URL_SEPOLIA`

### Logs utiles

Le script affiche des logs détaillés incluant :

- Adresses de tous les contrats déployés
- Configuration des prix et allocations
- Instructions de vérification
- Liens Etherscan

## Sécurité

### Bonnes pratiques

1. **Ne partagez jamais votre clé privée**
2. **Utilisez un compte dédié pour les tests**
3. **Vérifiez toujours les contrats après déploiement**
4. **Testez exhaustivement avant production**

### Variables sensibles

- `PRIVATE_KEY` : Gardez cette variable secrète
- `ETHERSCAN_API_KEY` : Peut être partagée (clé publique)

## Support

Pour toute question ou problème :

1. Vérifiez les logs du script de déploiement
2. Consultez la documentation Hardhat
3. Vérifiez la configuration réseau dans `hardhat.config.ts`
4. Testez d'abord sur le réseau local
