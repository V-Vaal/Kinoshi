# Scripts de copie d'ABIs

Ce dossier contient les scripts pour copier automatiquement les ABIs des contrats du backend vers le frontend.

## 📋 Prérequis

1. **Compilation des contrats** : Assurez-vous que les contrats sont compilés dans le backend :

   ```bash
   cd ../backend
   npm run compile
   ```

2. **Dépendances** : Pour le script TypeScript, installez `tsx` :
   ```bash
   npm install --save-dev tsx
   ```

## 🚀 Utilisation

### Script TypeScript (recommandé)

```bash
# Depuis le dossier frontend
npm run copy-abis
```

### Script Bash

```bash
# Depuis le dossier frontend
./scripts/copyabis.sh
```

### Exécution directe

```bash
# Script TypeScript
npx tsx scripts/copyabis.ts

# Script Bash
bash scripts/copyabis.sh
```

## 📁 Contrats copiés

Le script copie automatiquement les ABIs suivants :

| Contrat       | Fichier source                         | Fichier destination      |
| ------------- | -------------------------------------- | ------------------------ |
| Vault         | `Vault.sol/Vault.json`                 | `Vault.abi.json`         |
| TokenRegistry | `TokenRegistry.sol/TokenRegistry.json` | `TokenRegistry.abi.json` |
| MockPriceFeed | `MockPriceFeed.sol/MockPriceFeed.json` | `MockPriceFeed.abi.json` |
| MockUSDC      | `mocks/MockUSDC.sol/MockUSDC.json`     | `MockUSDC.abi.json`      |
| MockBTC       | `mocks/MockBTC.sol/MockBTC.json`       | `MockBTC.abi.json`       |
| MockBonds     | `mocks/MockBonds.sol/MockBonds.json`   | `MockBonds.abi.json`     |
| MockEquity    | `mocks/MockEquity.sol/MockEquity.json` | `MockEquity.abi.json`    |
| MockGold      | `mocks/MockGold.sol/MockGold.json`     | `MockGold.abi.json`      |

## 🔧 Configuration

### Chemins

- **Backend artifacts** : `../../backend/artifacts/contracts`
- **Frontend ABIs** : `../abis`

### Ajouter un nouveau contrat

1. **Script TypeScript** : Ajoutez une entrée dans le tableau `CONTRACTS_TO_COPY`
2. **Script Bash** : Ajoutez une entrée dans le tableau `contracts`

## ✅ Vérification

Après exécution, vérifiez que :

- Tous les fichiers ABI sont présents dans `../abis/`
- Les fichiers contiennent bien l'ABI (tableau JSON)
- Le nombre de fonctions est correct

## 🐛 Dépannage

### Erreur "Backend artifacts directory not found"

- Vérifiez que les contrats sont compilés dans le backend
- Vérifiez le chemin vers le dossier `artifacts`

### Erreur "ABI not found in artifact"

- Le fichier artifact existe mais ne contient pas d'ABI
- Vérifiez que le contrat est bien compilé

### Erreur "Source file not found"

- Le fichier artifact n'existe pas
- Vérifiez le nom du contrat et le chemin

## 📝 Notes

- Les scripts créent automatiquement le dossier `abis` s'il n'existe pas
- Les fichiers existants sont écrasés
- Le script affiche un résumé avec le nombre de fonctions copiées
- En cas d'erreur, le script s'arrête et affiche les détails
