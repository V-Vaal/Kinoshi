# Kinoshi

## Résumé

Kinoshi est une application décentralisée (DApp) basée sur un smart contract ERC-4626 permettant à des utilisateurs de s'exposer à un portefeuille diversifié d'actifs tokenisés (RWA) selon différents profils de risque.

Le projet est conçu dans le cadre des formations Développement Blockchain et DeFi par Alyra, avec une priorité donnée à la sécurité, la maintenabilité, la pédagogie et les bonnes pratiques Solidity.

### Fonctionnalités principales

- **Vault ERC-4626** : Contrat principal permettant l'investissement dans des actifs réels
- **Allocation automatique** : Répartition des fonds selon des stratégies prédéfinies
- **Gestion des frais** : Frais de sortie et de gestion configurables
- **Oracle de prix** : Système de prix pour les conversions d'actifs
- **Registre de tokens** : Gestion centralisée des tokens autorisés
- **Interface utilisateur** : DApp moderne avec Next.js et RainbowKit

---

## Structure du projet

```
Kinoshi/
├── backend/          # Smart contracts Solidity et infrastructure
│   ├── contracts/    # Contrats intelligents
│   ├── test/         # Tests unitaires et d'intégration
│   ├── scripts/      # Scripts de déploiement et utilitaires
│   └── artifacts/    # Fichiers compilés (générés)
├── frontend/         # Application utilisateur
│   ├── app/          # Pages Next.js (App Router)
│   ├── components/   # Composants React réutilisables
│   ├── constants/    # Configuration et adresses
│   └── scripts/      # Scripts utilitaires (copie ABIs)
└── README.md         # Documentation principale
```

---

## Quickstart

### Prérequis

- Node.js 18+ et npm
- Git
- Wallet Ethereum (MetaMask recommandé)

### Backend (Smart Contracts)

```bash
cd backend
npm install
npx hardhat compile
npx hardhat test
```

### Frontend (Application Web)

```bash
cd frontend
npm install
npm run dev
```

### Déploiement complet

```bash
# 1. Compiler et tester les contrats
cd backend
npx hardhat test

# 2. Déployer les contrats
npx hardhat run scripts/deploy.ts --network localhost

# 3. Lancer l'application
cd ../frontend
npm run dev
```

---

## Architecture technique

### Smart Contracts

- **Vault.sol** : Contrat principal ERC-4626 avec allocation automatique
- **TokenRegistry.sol** : Gestion des tokens autorisés
- **MockPriceFeed.sol** : Oracle de prix pour les tests
- **Mock Tokens** : Tokens simulés pour les actifs réels

### Frontend

- **Next.js 15** : Framework React avec App Router
- **Wagmi + Viem** : Hooks pour l'interaction blockchain
- **RainbowKit** : Interface de connexion wallet
- **Tailwind CSS** : Styling et composants
- **TypeScript** : Typage statique

### Tests

- **Hardhat** : Environnement de développement et tests
- **loadFixture** : Isolation des tests pour la fiabilité
- **Coverage** : Analyse de couverture de code
- **TDD** : Test-Driven Development

---

## Sécurité et bonnes pratiques

### Smart Contracts

- Utilisation d'OpenZeppelin pour les contrats de base
- Gestion des permissions avec AccessControl
- Protection contre les reentrancy attacks
- Validation des entrées utilisateur
- Gestion des erreurs avec des custom errors

### Tests

- Tests unitaires pour chaque fonction
- Tests d'intégration pour les workflows complets
- Tests de sécurité pour les vulnérabilités connues
- Couverture de code > 90%

### Développement

- Code review obligatoire
- Documentation NatSpec complète
- Standards de codage Solidity
- Versioning sémantique

---

## Réseaux supportés

- **Développement** : Hardhat Network (localhost)
- **Test** : Sepolia Testnet
- **Production** : Ethereum Mainnet (prévu)

---

## Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- Suivre les conventions Solidity
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation
- Vérifier la couverture de tests

---

## Licence

Ce projet est développé dans le cadre de la formation Alyra et suit les standards éducatifs de l'école.
