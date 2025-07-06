# OneToken

## Résumé

OneToken est une application décentralisée (DApp) basée sur un smart contract ERC-4626 permettant à des utilisateurs de s’exposer à un portefeuille diversifié d’actifs tokenisés (RWA) selon différents profils de risque.

Le projet est conçu dans le cadre des formations Développement Blockchain et DeFi par Alyra, avec une priorité donnée à la sécurité, la maintenabilité, la pédagogie et les bonnes pratiques Solidity.

---

## Structure du projet

- `backend/` – Smart contracts Solidity | tests unitaires | scripts Hardhat
- `frontend/` – DApp React (Next.js) avec wagmi et RainbowKit

---

## Quickstart

### Backend (Hardhat)
```bash
cd backend
npm install
npx hardhat test
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npx run dev
```
---

## Infos techniques

- Réseau testnet : Sepolia (ETH)
- Réseau mainnet cible : Ethereum
- Standard principal : ERC-4626 (Vault Tokenized Shares)
- Solidity : 0.8.28 avec OpenZeppelin
- Tests : Hardhat, @nomicfoundation/hardhat-network-helpers, loadFixture pour isolation
- Frontend : Next.js, wagmi, RainbowKit, TypeScript

---

## Notes

- Le projet suit une approche Test-Driven Development (TDD) : chaque fonctionnalité est testée avant intégration.

- Sécurité, lisibilité et maintenabilité sont prioritaires (standards ConsenSys).

- Ce dépôt est structuré pour une évolution modulaire, avec des fonctionnalités séparées par branche ou par PR.
