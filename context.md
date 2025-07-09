# ✅ CONTEXTE TECHNIQUE : PROJET Kinoshi (Alyra)

## 🔒 Objectif

Développer une DApp pédagogique, maintenable et sécurisée autour d’un **Vault ERC-4626**, permettant à un utilisateur :
- d’investir des **MockUSDC** dans une stratégie équilibrée,
- de recevoir un token de part,
- et d’être exposé fictivement à des **actifs RWA mockés** (or, BTC, bonds, equity) via allocation automatique.

Le contrat **détient réellement** les tokens mockés, et applique des frais simulés.

---

## 🏗️ État actuel du projet

- ✅ Structure du repo prête (contrats, tests, frontend, déploiement)
- ✅ `Vault.sol` basé sur ERC-4626 : `deposit`, `redeem`, `totalAssets`, `preview`, `bootstrapVault()`, `accrueManagementFee()`
- ✅ `TokenRegistry.sol` pour enregistrer les tokens mockés
- ✅ Tests de base en place (`vault.test.ts`) – à compléter avec tous les cas listés dans le Plan v1.1
- ⚙️ Composants frontend en cours d'intégration (Deposit, Redeem, Admin, Profil de risque, Sélecteur de stratégie)

---

## 📦 Structure du projet

```
contracts/
├── Vault.sol              ← Smart contract principal ERC-4626
├── MockToken.sol          ← Tokens RWA mockés : MockGold, MockBTC, etc.
├── TokenRegistry.sol      ← Registre onchain des tokens autorisés

test/
├── vault.test.ts          ← Tests fonctionnels et de sécurité

scripts/
├── deploy.ts              ← Déploiement local et Sepolia ETH

components/
├── DepositForm.tsx
├── RedeemForm.tsx
├── VaultInfo.tsx
├── AdminPanel.tsx
├── StrategySelector.tsx
├── RiskProfileForm.tsx

context/
├── VaultContext.tsx       ← Stocke les infos utilisateur & stratégie

constants/
├── index.ts               ← Adresse des contrats déployés

utils/
├── client.ts              ← wagmi config

abis/
├── Vault.json
├── TokenRegistry.json
```

---

## ⚙️ Standards Solidity

- Version fixée : `0.8.28` (sans `^`)
- OpenZeppelin (ERC-4626, ReentrancyGuard, Pausable)
- Aucun appel externe dans les `modifiers`
- Struct `AssetAllocation` packée
- Variables critiques en `immutable`
- Events pour chaque action publique
- `custom errors` pour les `require` critiques
- Décimales strictes alignées sur actifs réels :
  - USDC → 6
  - BTC → 8
  - Or, Bonds, Equity → 18

---

## 🧪 Tests Solidity

- Hardhat + `@nomicfoundation/hardhat-network-helpers`
- Isolation stricte via `loadFixture()`
- 1 test = 1 fonctionnalité
- Tests sécurité complets selon la checklist ConsenSys
- Invariant : `totalSupply()` ne peut jamais revenir à 0
- Tous les cas décrits dans le Plan v1.1 doivent être couverts

---

## 🔐 Sécurité (ConsenSys)

- `nonReentrant` sur `redeem`
- `Pausable` sur fonctions critiques
- `fallback()` et `receive()` → `revert`
- Protection contre :
  - `Reentrancy`, `DoS`, `Front-running`
  - `Storage disorder`, `force-feeding`, `exception disorder`
- Tests d’invariants

---

## 📈 Logique économique

- Vault basé sur MockUSDC (6 décimales)
- Frais de sortie (exitFeeBps) appliqués dans `redeem()`
- Frais de gestion simulés par mint de parts à l’admin via `accrueManagementFee()`
- Dépôt initial `bootstrapVault()` à une adresse `treasury` → non retirable
- Pondération des actifs par stratégie
- Valeur de part dynamique basée sur `totalAssets() = somme(poids × prix_fictif × balance)`

---

## 🧠 Fonctionnalités front

- Connexion wallet (wagmi + RainbowKit)
- Sélecteur de stratégie (prévu : équilibrée uniquement)
- Questionnaire profil de risque (blocage du dépôt si non rempli)
- Formulaires : `Deposit`, `Redeem`, admin UI (sliders frais & pondération)
- Tooltip : “Prix fictifs (démo)”, affichage clair des erreurs Solidity

---

## 🌍 Environnement

- Déploiement local via Hardhat
- Testnet cible : **Sepolia Ethereum**
- Pas de custody réelle – tokens mockés uniquement
- Préparation à une future extension vers Base / RWA réels en V2

---

## 📌 Règles Cursor à respecter

- Respecter le Plan Technique v1.1 (`Planv1.1.md`)
- Utiliser `fixtures` pour tous les tests
- Générer un code typé, lisible, modulaire
- Ajouter systématiquement les tests et modifiers requis
- Documenter toute fonction publique
- Nommer proprement les custom errors, events et structs
