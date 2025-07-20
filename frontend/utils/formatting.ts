import { formatUnits } from 'viem'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { tokenRegistryAddress } from '@/constants'

/**
 * Récupère les décimales d'un token depuis le TokenRegistry
 * @param tokenAddress - Adresse du token
 * @returns Nombre de décimales (défaut: 18)
 */
export const getTokenDecimals = async (
  tokenAddress: string
): Promise<number> => {
  try {
    const decimals = await readContract(wagmiConfig, {
      abi: [
        {
          inputs: [{ name: 'token', type: 'address' }],
          name: 'getTokenDecimals',
          outputs: [{ name: '', type: 'uint8' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      address: tokenRegistryAddress as `0x${string}`,
      functionName: 'getTokenDecimals',
      args: [tokenAddress as `0x${string}`],
    })
    return Number(decimals)
  } catch (error) {
    console.warn(
      `Impossible de récupérer les décimales pour ${tokenAddress}, utilisation de 18 par défaut`
    )
    return 18 // Fallback vers 18 décimales
  }
}

/**
 * Formate un montant en USDC avec le format français
 * @param amount - Montant en wei (18 décimales)
 * @param decimals - Nombre de décimales du token (défaut: 18)
 * @returns Montant formaté en français (ex: "1 234,56")
 */
export const formatCurrency = (
  amount: bigint,
  decimals: number = 18
): string => {
  const value = parseFloat(formatUnits(amount, decimals))
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formate un montant USDC pour l'affichage (traite 1e18 comme 1 USDC)
 * @param amount - Montant en wei (18 décimales)
 * @returns Montant USDC formaté (ex: "1 000,00 USDC")
 */
export const formatUSDC = (amount: bigint): string => {
  const value = parseFloat(formatUnits(amount, 18))
  return value
    .toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'code',
    })
    .replace('USD', 'USDC')
}

/**
 * Formate un montant avec les décimales appropriées selon le token
 * @param amount - Montant en wei
 * @param decimals - Nombre de décimales du token (défaut: 18)
 * @returns Montant formaté avec les bonnes décimales
 */
export const formatQuantity = (
  amount: bigint,
  decimals: number = 18
): string => {
  const value = parseFloat(formatUnits(amount, decimals))
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals > 6 ? 4 : 2,
    maximumFractionDigits: decimals > 6 ? 6 : 4,
  })
}

/**
 * Formate un montant pour un token spécifique en utilisant ses décimales
 * @param amount - Montant en wei
 * @param tokenAddress - Adresse du token
 * @returns Montant formaté avec les décimales du token
 */
export const formatTokenAmount = async (
  amount: bigint,
  tokenAddress: string
): Promise<string> => {
  const decimals = await getTokenDecimals(tokenAddress)
  return formatQuantity(amount, decimals)
}

/**
 * Formate un pourcentage avec 2 décimales
 * @param value - Valeur décimale (ex: 0.1234 pour 12.34%)
 * @returns Pourcentage formaté (ex: "12,34%")
 */
export const formatPercentage = (value: number): string => {
  return (
    (value * 100).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + '%'
  )
}

/**
 * Formate une date en français
 * @param timestamp - Timestamp Unix en secondes
 * @returns Date formatée en français
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formate un hash de transaction (affiche les premiers et derniers caractères)
 * @param hash - Hash de transaction
 * @param prefix - Nombre de caractères à afficher au début (défaut: 6)
 * @param suffix - Nombre de caractères à afficher à la fin (défaut: 4)
 * @returns Hash formaté (ex: "0x1234...abcd")
 */
export const formatTransactionHash = (
  hash: string,
  prefix: number = 6,
  suffix: number = 4
): string => {
  if (hash.length <= prefix + suffix) return hash
  return `${hash.slice(0, prefix)}...${hash.slice(-suffix)}`
}

/**
 * Formate une valeur en USDC avec 2 décimales max
 */
export function formatUSDCValue(value: number): string {
  return value
    .toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'code',
    })
    .replace('USD', 'USDC')
}
