# Configuration Frontend Sepolia - Kinoshi

Ce guide explique comment configurer le frontend pour fonctionner avec le réseau de test Sepolia.

## Prérequis

### 1. Variables d'environnement

Créez un fichier `.env.local` dans le dossier `frontend/` avec les variables suivantes :

```env
# Configuration Sepolia pour le frontend Kinoshi

# URL RPC pour Sepolia (Infura, Alchemy, etc.)
NEXT_PUBLIC_RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Project ID WalletConnect (optionnel)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Configuration réseau
NEXT_PUBLIC_NETWORK_NAME=Sepolia
NEXT_PUBLIC_NETWORK_CHAIN_ID=11155111

# URLs des explorateurs
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io

# Configuration de l'application
NEXT_PUBLIC_APP_NAME=Kinoshi
NEXT_PUBLIC_APP_DESCRIPTION=Gestionnaire de portefeuille sur Sepolia
NEXT_PUBLIC_APP_URL=https://kinoshi.app
```

### 2. Obtenir une URL RPC Sepolia

Vous pouvez obtenir une URL RPC gratuite via :

- **Infura** : https://infura.io/ (gratuit jusqu'à 100k requêtes/jour)
- **Alchemy** : https://alchemy.com/ (gratuit jusqu'à 300M requêtes/mois)
- **QuickNode** : https://quicknode.com/ (gratuit jusqu'à 50k requêtes/mois)

## Configuration

### 1. Mise à jour des adresses de contrats

Après le déploiement des contrats sur Sepolia, mettez à jour le fichier `constants/index.sepolia.ts` avec les vraies adresses :

```typescript
export const vaultAddress = '0x...' // Adresse du Vault déployé
export const tokenRegistryAddress = '0x...' // Adresse du TokenRegistry déployé
export const mockTokenAddresses = {
  mUSDC: '0x...', // Adresse du MockUSDC déployé
  mGOLD: '0x...', // Adresse du MockGold déployé
  mBTC: '0x...', // Adresse du MockBTC déployé
  mBONDS: '0x...', // Adresse du MockBonds déployé
  mEQUITY: '0x...', // Adresse du MockEquity déployé
}
export const mockOracleAddress = '0x...' // Adresse du MockPriceFeed déployé
```

### 2. Configuration Wagmi

Le fichier `lib/wagmi.sepolia.ts` est déjà configuré pour Sepolia. Pour l'utiliser :

```typescript
import { wagmiConfig } from '../lib/wagmi.sepolia';

// Dans votre composant principal
<WagmiProvider config={wagmiConfig}>
  {/* Votre application */}
</WagmiProvider>
```

### 3. Configuration des ABIs

Les ABIs sont automatiquement copiés depuis le backend. Assurez-vous qu'ils sont à jour :

```bash
cd backend
npm run copyabis
```

## Développement

### 1. Lancer le serveur de développement

```bash
cd frontend
npm run dev
```

### 2. Tester sur Sepolia

1. Connectez votre wallet (MetaMask, WalletConnect, etc.)
2. Basculez vers le réseau Sepolia
3. Assurez-vous d'avoir des ETH Sepolia (obtenez-en via un faucet)
4. Testez les fonctionnalités de l'application

### 3. Build de production

```bash
npm run build
npm run start
```

## Tests

### 1. Tests de connectivité

- Vérifiez que votre wallet se connecte au réseau Sepolia
- Testez la lecture des contrats (pas de gas requis)
- Vérifiez l'affichage des prix et allocations

### 2. Tests de transactions

- Testez un petit dépôt (quelques USDC)
- Vérifiez l'allocation automatique
- Testez un retrait avec frais

### 3. Tests d'interface

- Vérifiez l'affichage des adresses de contrats
- Testez la navigation entre les pages
- Vérifiez les liens vers Etherscan Sepolia

## Dépannage

### Erreurs courantes

#### "Failed to fetch"

- **Cause** : URL RPC incorrecte ou service indisponible
- **Solution** : Vérifiez votre URL RPC et testez-la

#### "Contract not found"

- **Cause** : Adresses de contrats incorrectes
- **Solution** : Mettez à jour les adresses dans `constants/index.sepolia.ts`

#### "Wrong network"

- **Cause** : Wallet connecté au mauvais réseau
- **Solution** : Basculez vers Sepolia dans votre wallet

#### "Insufficient funds"

- **Cause** : Pas assez d'ETH Sepolia
- **Solution** : Obtenez des ETH via un faucet Sepolia

### Logs utiles

Activez les logs de développement dans votre navigateur pour déboguer :

```javascript
// Dans la console du navigateur
localStorage.setItem('debug', 'wagmi:*')
```

## Déploiement

### 1. Build de production

```bash
npm run build
```

### 2. Vérification

```bash
npm run start
```

### 3. Déploiement

Déployez le dossier `.next` sur votre plateforme préférée :

- **Vercel** : Connectez votre repo GitHub
- **Netlify** : Drag & drop du dossier `.next`
- **AWS S3** : Upload du dossier `.next`

## Sécurité

### Bonnes pratiques

1. **Ne committez jamais** les fichiers `.env.local`
2. **Vérifiez les adresses** de contrats avant utilisation
3. **Testez sur Sepolia** avant production
4. **Utilisez des comptes de test** pour les développements

### Variables sensibles

- `NEXT_PUBLIC_RPC_URL_SEPOLIA` : Peut être publique (clé API)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` : Peut être publique
- Les adresses de contrats : Peuvent être publiques

## Support

Pour toute question ou problème :

1. Vérifiez les logs de la console du navigateur
2. Testez la connectivité réseau
3. Vérifiez la configuration des variables d'environnement
4. Consultez la documentation Wagmi et Next.js
