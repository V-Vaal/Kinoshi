#!/bin/bash

# Script pour copier les ABIs des contrats du backend vers le frontend
# Usage: ./scripts/copyabis.sh

set -e

# Configuration des chemins
BACKEND_ARTIFACTS_DIR="../backend/artifacts/contracts"
FRONTEND_ABIS_DIR="abis"

echo "🚀 Starting ABI copy process..."
echo "📁 Backend artifacts: $BACKEND_ARTIFACTS_DIR"
echo "📁 Frontend ABIs: $FRONTEND_ABIS_DIR"
echo ""

# Vérifier que le dossier backend existe
if [ ! -d "$BACKEND_ARTIFACTS_DIR" ]; then
    echo "❌ Backend artifacts directory not found: $BACKEND_ARTIFACTS_DIR"
    echo "Make sure you have compiled the contracts in the backend first."
    exit 1
fi

# Créer le dossier frontend/abis s'il n'existe pas
if [ ! -d "$FRONTEND_ABIS_DIR" ]; then
    mkdir -p "$FRONTEND_ABIS_DIR"
    echo "📁 Created frontend ABIs directory: $FRONTEND_ABIS_DIR"
fi

# Fonction pour copier un ABI
copy_abi() {
    local contract_name=$1
    local backend_path=$2
    local frontend_name=$3
    
    local full_backend_path="$BACKEND_ARTIFACTS_DIR/$backend_path"
    local full_frontend_path="$FRONTEND_ABIS_DIR/$frontend_name"
    
    if [ ! -f "$full_backend_path" ]; then
        echo "❌ Source file not found: $full_backend_path"
        return 1
    fi
    
    # Extraire l'ABI et le copier
    if jq -r '.abi' "$full_backend_path" > "$full_frontend_path" 2>/dev/null; then
        local function_count=$(jq '.abi | length' "$full_backend_path")
        echo "✅ Copied $contract_name ABI ($function_count functions)"
        return 0
    else
        echo "❌ Failed to copy $contract_name"
        return 1
    fi
}

# Copier tous les ABIs
success_count=0
total_count=0

# Liste des contrats à copier
contracts=(
    "Vault:Vault.sol/Vault.json:Vault.abi.json"
    "TokenRegistry:TokenRegistry.sol/TokenRegistry.json:TokenRegistry.abi.json"
    "MockPriceFeed:MockPriceFeed.sol/MockPriceFeed.json:MockPriceFeed.abi.json"
    "MockUSDC:mocks/MockUSDC.sol/MockUSDC.json:MockUSDC.abi.json"
    "MockBTC:mocks/MockBTC.sol/MockBTC.json:MockBTC.abi.json"
    "MockBonds:mocks/MockBonds.sol/MockBonds.json:MockBonds.abi.json"
    "MockEquity:mocks/MockEquity.sol/MockEquity.json:MockEquity.abi.json"
    "MockGold:mocks/MockGold.sol/MockGold.json:MockGold.abi.json"
)

for contract_info in "${contracts[@]}"; do
    IFS=':' read -r name backend_path frontend_name <<< "$contract_info"
    total_count=$((total_count + 1))
    
    if copy_abi "$name" "$backend_path" "$frontend_name"; then
        success_count=$((success_count + 1))
    fi
done

echo ""
echo "📊 Summary: $success_count/$total_count ABIs copied successfully"

if [ $success_count -eq $total_count ]; then
    echo "🎉 All ABIs copied successfully!"
else
    echo "⚠️  Some ABIs failed to copy. Check the errors above."
    exit 1
fi 