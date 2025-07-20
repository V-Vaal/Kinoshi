import { formatUnits } from 'viem'
import { AssetAllocation } from '@/context/TokenRegistryContext'

export interface UserRWABreakdown {
  symbol: string
  tokenAddress: string
  allocationPercent: number
  oraclePrice: number
  userAllocation: number // Montant investi dans cet actif
  currentValue: number // Valeur actuelle en USDC
  percent: number // Pourcentage de l'investissement total
}

export interface UserPortfolioValue {
  totalInvested: number
  currentValue: number
  performance: number
  performancePercent: number
  breakdown: UserRWABreakdown[]
}

import { mockTokenAddresses } from '@/constants'

// Prix oracle mockés (à remplacer par un vrai oracle en prod)
const MOCK_ORACLE_PRICES: Record<string, number> = {
  [mockTokenAddresses.mGOLD]: 2000, // GOLD
  [mockTokenAddresses.mBTC]: 45000, // BTC
  [mockTokenAddresses.mBONDS]: 100, // BONDS
  [mockTokenAddresses.mEQUITY]: 50, // EQUITY
}

// Symboles des tokens (à récupérer depuis le registry)
const TOKEN_SYMBOLS: Record<string, string> = {
  [mockTokenAddresses.mGOLD]: 'GOLD',
  [mockTokenAddresses.mBTC]: 'BTC',
  [mockTokenAddresses.mBONDS]: 'BONDS',
  [mockTokenAddresses.mEQUITY]: 'EQUITY',
}

/**
 * Calcule la répartition RWA spécifique à l'utilisateur
 * basée sur son investissement et les prix oracle
 */
export function getUserRwaBreakdown(
  amountInvested: number,
  allocations: AssetAllocation[]
): UserPortfolioValue {
  if (amountInvested <= 0 || !allocations.length) {
    return {
      totalInvested: 0,
      currentValue: 0,
      performance: 0,
      performancePercent: 0,
      breakdown: [],
    }
  }

  const breakdown: UserRWABreakdown[] = allocations
    .filter((allocation) => allocation.active)
    .map((allocation) => {
      const allocationPercent = parseFloat(formatUnits(allocation.weight, 18))
      const oraclePrice = MOCK_ORACLE_PRICES[allocation.token] || 0
      const userAllocation = amountInvested * (allocationPercent / 100)
      const currentValue = userAllocation * oraclePrice
      const symbol = TOKEN_SYMBOLS[allocation.token] || 'UNKNOWN'

      return {
        symbol,
        tokenAddress: allocation.token,
        allocationPercent,
        oraclePrice,
        userAllocation,
        currentValue,
        percent: allocationPercent,
      }
    })

  const currentValue = breakdown.reduce(
    (sum, item) => sum + item.currentValue,
    0
  )
  const performance = currentValue - amountInvested
  const performancePercent =
    amountInvested > 0 ? (performance / amountInvested) * 100 : 0

  return {
    totalInvested: amountInvested,
    currentValue,
    performance,
    performancePercent,
    breakdown,
  }
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
