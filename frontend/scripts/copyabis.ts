import * as fs from 'fs'
import * as path from 'path'

// Configuration des chemins
const BACKEND_ARTIFACTS_DIR = path.join(
  __dirname,
  '../backend/artifacts/contracts'
)
const FRONTEND_ABIS_DIR = path.join(__dirname, '../abis')

// Liste des contrats à copier avec leurs chemins dans le backend
const CONTRACTS_TO_COPY = [
  {
    name: 'Vault',
    backendPath: 'Vault.sol/Vault.json',
    frontendName: 'Vault.abi.json',
  },
  {
    name: 'TokenRegistry',
    backendPath: 'TokenRegistry.sol/TokenRegistry.json',
    frontendName: 'TokenRegistry.abi.json',
  },
  {
    name: 'MockPriceFeed',
    backendPath: 'MockPriceFeed.sol/MockPriceFeed.json',
    frontendName: 'MockPriceFeed.abi.json',
  },
  {
    name: 'MockUSDC',
    backendPath: 'mocks/MockUSDC.sol/MockUSDC.json',
    frontendName: 'MockUSDC.abi.json',
  },
  {
    name: 'MockBTC',
    backendPath: 'mocks/MockBTC.sol/MockBTC.json',
    frontendName: 'MockBTC.abi.json',
  },
  {
    name: 'MockBonds',
    backendPath: 'mocks/MockBonds.sol/MockBonds.json',
    frontendName: 'MockBonds.abi.json',
  },
  {
    name: 'MockEquity',
    backendPath: 'mocks/MockEquity.sol/MockEquity.json',
    frontendName: 'MockEquity.abi.json',
  },
  {
    name: 'MockGold',
    backendPath: 'mocks/MockGold.sol/MockGold.json',
    frontendName: 'MockGold.abi.json',
  },
]

// Fonction pour extraire l'ABI d'un fichier artifact
function extractABI(artifactPath: string): any[] {
  try {
    const artifactContent = fs.readFileSync(artifactPath, 'utf8')
    const artifact = JSON.parse(artifactContent)

    if (!artifact.abi) {
      throw new Error(`ABI not found in artifact: ${artifactPath}`)
    }

    return artifact.abi
  } catch (error) {
    console.error(`❌ Error reading artifact ${artifactPath}:`, error)
    throw error
  }
}

// Fonction pour copier un ABI
function copyABI(contract: {
  name: string
  backendPath: string
  frontendName: string
}) {
  const backendPath = path.join(BACKEND_ARTIFACTS_DIR, contract.backendPath)
  const frontendPath = path.join(FRONTEND_ABIS_DIR, contract.frontendName)

  try {
    // Vérifier si le fichier source existe
    if (!fs.existsSync(backendPath)) {
      console.error(`❌ Source file not found: ${backendPath}`)
      return false
    }

    // Extraire l'ABI
    const abi = extractABI(backendPath)

    // Créer le fichier ABI dans le frontend
    const abiContent = JSON.stringify(abi, null, 2)
    fs.writeFileSync(frontendPath, abiContent, 'utf8')

    console.log(`✅ Copied ${contract.name} ABI (${abi.length} functions)`)
    return true
  } catch (error) {
    console.error(`❌ Failed to copy ${contract.name}:`, error)
    return false
  }
}

// Fonction principale
function main() {
  console.log('🚀 Starting ABI copy process...')
  console.log(`📁 Backend artifacts: ${BACKEND_ARTIFACTS_DIR}`)
  console.log(`📁 Frontend ABIs: ${FRONTEND_ABIS_DIR}`)
  console.log('')

  // Vérifier que le dossier backend existe
  if (!fs.existsSync(BACKEND_ARTIFACTS_DIR)) {
    console.error(
      `❌ Backend artifacts directory not found: ${BACKEND_ARTIFACTS_DIR}`
    )
    console.error(
      'Make sure you have compiled the contracts in the backend first.'
    )
    process.exit(1)
  }

  // Créer le dossier frontend/abis s'il n'existe pas
  if (!fs.existsSync(FRONTEND_ABIS_DIR)) {
    fs.mkdirSync(FRONTEND_ABIS_DIR, { recursive: true })
    console.log(`📁 Created frontend ABIs directory: ${FRONTEND_ABIS_DIR}`)
  }

  let successCount = 0
  let totalCount = CONTRACTS_TO_COPY.length

  // Copier tous les ABIs
  for (const contract of CONTRACTS_TO_COPY) {
    if (copyABI(contract)) {
      successCount++
    }
  }

  console.log('')
  console.log(
    `📊 Summary: ${successCount}/${totalCount} ABIs copied successfully`
  )

  if (successCount === totalCount) {
    console.log('🎉 All ABIs copied successfully!')
  } else {
    console.log('⚠️  Some ABIs failed to copy. Check the errors above.')
    process.exit(1)
  }
}

// Exécuter le script
if (require.main === module) {
  main()
}

export { main as copyABIs }
