# ✅ CONTEXTE TECHNIQUE : PROJET OneToken (Alyra)

## 🔒 Objectif

Construire une DApp sécurisée, maintenable et testée autour d’un **Vault ERC-4626** qui simule un investissement dans des actifs **RWA bridgés mockés**, avec dépôt en **MockUSDC** et choix de stratégie (agressive, équilibrée, conservatrice).  
Le contrat ne détient jamais les tokens RWA (MockGold, mBTC…) et ne manipule que l'USDC.

---

## 🏗️ État actuel du projet (étape 1/8)

- ✅ Structure initiale créée (`backend/`, `frontend/`, tests, CI, fichiers de config)
- ✅ `Vault.sol` implémenté (base ERC-4626 avec `deposit`, `redeem`, `totalAssets`, `custom errors`)
- ⚠️ `vault.test.ts` en cours : rédaction des tests unitaires de base
- Prochaine étape : finaliser les tests fonctionnels et sécurité sur le contrat `Vault.sol`

---

## 📦 Structure du projet

### Backend (Hardhat + Solidity)

/backend/contracts/
├── Vault.sol ← Smart contract principal (ERC-4626)
├── MockUSDC.sol ← Asset de base (6 décimales)
├── TokenRegistry.sol ← Registre de tokens mockés (à venir)

├── test/
│ └── Vault.test.ts ← Tests unitaires (fonctionnels + sécurité à venir)
│
├── scripts/
│ └── deploy.ts ← Script de déploiement local et Sepolia


### Frontend (Next.js + wagmi + RainbowKit)

/frontend/app/ ← Pages principales
/frontend/components/ ← UI : DepositForm, RedeemForm, VaultInfo, etc.
/frontend/constants/ ← Adresse des contrats, réseau Sepolia
/frontend/lib/ ← wagmi client + utils
/frontend/context/ ← VaultContext, UserContext, etc.
/frontend/lib/i18n/ ← Traductions fr/en

ContextProvider.tsx ← Wrap tous les providers globaux


---

## ⚙️ Standards Solidity

- Version fixée : `0.8.28` (sans ^)
- OpenZeppelin utilisé (ERC-4626, ReentrancyGuard, Pausable)
- Pas d’appel externe dans les `modifiers`
- Structs optimisés (packing, pas d’initialisation inutile)
- Émission d’un `event` pour chaque action publique
- Utilisation de `custom errors` à la place de `require("...")`
- Le Vault ne détient jamais de tokens RWA (mock uniquement)

---

## 🧪 Tests unitaires (Hardhat)

- Framework : Hardhat + Chai + `@nomicfoundation/hardhat-network-helpers`
- Isolation via `loadFixture()` : chaque test indépendant
- Vérification complète des `structs` si modifiés
- Fichier de test par contrat (commencé avec `Vault.test.ts`)
- Structure en cours pour ajouter les tests de sécurité

### Sécurité à tester (checklist ConsenSys)

- `Reentrancy` (`redeem`, `withdraw`)
- `Denial of Service` (gas grief, boucle)
- `Force Feeding` (`send()` sur Vault)
- `Front-running` (`deposit`)
- `Fallback` / `receive` piégeables → `revert`
- `onlyOwner` → admin restreint
- `Storage/exception disorder`, `invariants`

Référence : https://consensys.github.io/smart-contract-best-practices/

---

## 📈 Conventions et logique économique

- Actif de base : `MockUSDC` (6 décimales)
- Token de part (share) émis en 18 décimales
- Ratio de départ : `1e6 MockUSDC = 1e18 shares` (1:1)
- `totalAssets()` = `MockUSDC.balanceOf(address(this))`  
  (pas de pondération RWA onchain – fait dans le front)

---

## 🧠 TDD & Plan de développement

> Le projet suit un **plan de commit structuré en 8 étapes** (backend → sécurité → frontend → déploiement).

### Actuellement (étape 1) :

- 🎯 Implémentation du Vault de base (`Vault.sol`)
- 🔬 Rédaction des tests fonctionnels dans `Vault.test.ts`
- 🧪 Tests de sécurité et d’événements à ajouter
- 🛠️ Fixtures en cours : `vault + mockUSDC`

---

## ✨ Particularités du projet OneToken

- Les actifs RWA (or, bonds, BTC, equity) sont **mockés**
- Le Vault **ne contient jamais ces tokens** (vérifié explicitement dans les tests)
- Pondération par stratégie (prévu : équilibrée, défensif, offensif)
- Les prix sont simulés côté front (mock admin)

---

## 🌍 Environnement

- Déploiement local via Hardhat pour tests
- Testnet : **Sepolia ETH**
- Cible future : Base mainnet ou autre L2 si intégration RWA réelle

---

## 📌 Instructions Cursor

Tu dois :

- Respecter cette structure et ce contexte
- Ajouter les tests associés à toute nouvelle fonction
- Utiliser les `custom errors`, `fixtures`, `nonReentrant`, `Pausable`
- Générer un code **typé**, **isolé** et **testable**
- Appliquer les règles de sécurité **ConsenSys** à chaque ajout de logique sensible


