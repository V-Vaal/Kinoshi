import { formatUnits } from 'viem'

/**
 * Formate un montant en USDC avec le format français
 * @param amount - Montant en wei (6 décimales)
 * @param decimals - Nombre de décimales du token (défaut: 6 pour USDC)
 * @returns Montant formaté en français (ex: "1 234,56")
 */
export const formatCurrency = (
  amount: bigint,
  decimals: number = 6
): string => {
  const value = parseFloat(formatUnits(amount, decimals))
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formate un montant avec les décimales appropriées selon le token
 * @param amount - Montant en wei
 * @param decimals - Nombre de décimales du token
 * @returns Montant formaté avec les bonnes décimales
 */
export const formatQuantity = (amount: bigint, decimals: number): string => {
  const value = parseFloat(formatUnits(amount, decimals))
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals > 6 ? 4 : 2,
    maximumFractionDigits: decimals > 6 ? 6 : 4,
  })
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
