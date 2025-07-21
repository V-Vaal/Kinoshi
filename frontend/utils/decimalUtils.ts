import { formatUnits, parseUnits } from 'viem'

/**
 * 🎯 CONVENTION DÉCIMALES KINOSHI
 *
 * ✅ CALCULS INTERNES : 18 décimales
 * - Tous les tokens (USDC, GOLD, BTC, BONDS, EQUITY) ont 18 décimales
 * - Les prix oracle sont en 18 décimales
 * - Les balances sont en 18 décimales
 * - Les shares sont en 18 décimales
 *
 * ✅ AFFICHAGE FRONTEND : 2 décimales
 * - Toutes les valeurs monétaires affichées en USDC avec 2 décimales
 * - Formatage : .toFixed(2)
 *
 * ✅ CONVERSIONS
 * - formatUnits(value, 18) pour convertir bigint → float
 * - parseUnits(value, 18) pour convertir float → bigint
 */

/**
 * Convertit une valeur bigint en 18 décimales vers un float pour les calculs
 * @param value - Valeur en bigint avec 18 décimales
 * @returns Float pour les calculs
 */
export function fromWei(value: bigint): number {
  return parseFloat(formatUnits(value, 18))
}

/**
 * Convertit un float vers bigint en 18 décimales pour les transactions
 * @param value - Valeur en float
 * @returns Bigint avec 18 décimales
 */
export function toWei(value: number): bigint {
  return parseUnits(value.toString(), 18)
}

/**
 * Formate une valeur pour l'affichage en USDC (2 décimales)
 * @param value - Valeur en float
 * @returns String formatée pour l'affichage
 */
export function formatForDisplay(value: number): string {
  return value.toFixed(2)
}

/**
 * Calcule la quantité de tokens détenue par un utilisateur
 * @param vaultBalance - Balance totale du token dans le vault (18 décimales)
 * @param userShares - Shares de l'utilisateur (18 décimales)
 * @param totalSupply - Total supply du vault (18 décimales)
 * @returns Quantité de tokens détenue par l'utilisateur (float)
 */
export function calculateUserTokenQuantity(
  vaultBalance: bigint,
  userShares: bigint,
  totalSupply: bigint
): number {
  if (totalSupply === 0n) return 0

  // userPortion = userShares / totalSupply
  const userPortion = Number(userShares) / Number(totalSupply)

  // userTokenQuantity = (vaultBalance * userPortion) / 1e18
  const userTokenQuantity = (Number(vaultBalance) * userPortion) / 1e18

  return userTokenQuantity
}

/**
 * Calcule la valeur USDC d'une quantité de tokens
 * @param tokenQuantity - Quantité de tokens (float)
 * @param oraclePrice - Prix oracle en USDC (float)
 * @returns Valeur en USDC (float)
 */
export function calculateTokenValue(
  tokenQuantity: number,
  oraclePrice: number
): number {
  return tokenQuantity * oraclePrice
}

/**
 * Calcule la quantité de tokens achetés selon la stratégie d'allocation
 * @param totalInvested - Montant total investi en USDC
 * @param allocationPercent - Pourcentage d'allocation (0-100)
 * @param oraclePrice - Prix oracle du token en USDC
 * @returns Quantité de tokens achetés (float)
 */
export function calculateTokenQuantityFromStrategy(
  totalInvested: number,
  allocationPercent: number,
  oraclePrice: number
): number {
  if (oraclePrice <= 0) return 0

  // Montant USDC investi dans ce token
  const amountInvestedInToken = totalInvested * (allocationPercent / 100)

  // Quantité de tokens = Montant USDC / Prix oracle
  const tokenQuantity = amountInvestedInToken / oraclePrice

  return tokenQuantity
}

/**
 * Vérifie si une valeur est réaliste pour l'affichage
 * @param value - Valeur à vérifier
 * @param maxValue - Valeur maximale acceptable
 * @returns True si la valeur est réaliste
 */
export function isRealisticValue(
  value: number,
  maxValue: number = 1000000
): boolean {
  return value > 0 && value < maxValue
}

/**
 * Log de debug pour les calculs de décimales
 * @param label - Label du log
 * @param data - Données à logger
 */
export function debugDecimalCalculation(
  label: string,
  data: Record<string, any>
): void {
  console.log(`🔍 ${label}:`, data)
}
