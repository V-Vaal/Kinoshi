import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { useUserHistory } from '@/utils/useUserHistory'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { mockTokenAddresses } from '@/constants'

// Prix oracle mockés (temporaire pour éviter les boucles)
const MOCK_ORACLE_PRICES: Record<string, number> = {
  [mockTokenAddresses.mGOLD]: 2000, // GOLD
  [mockTokenAddresses.mBTC]: 45000, // BTC
  [mockTokenAddresses.mBONDS]: 100, // BONDS
  [mockTokenAddresses.mEQUITY]: 50, // EQUITY
}

// Symboles des tokens
const TOKEN_SYMBOLS: Record<string, string> = {
  [mockTokenAddresses.mGOLD]: 'GOLD',
  [mockTokenAddresses.mBTC]: 'BTC',
  [mockTokenAddresses.mBONDS]: 'BONDS',
  [mockTokenAddresses.mEQUITY]: 'EQUITY',
}

export interface PortfolioToken {
  symbol: string
  tokenAddress: string
  allocationPercent: number
  amountInvested: number // USDC investi
  currentValue: number // USDC actuel
  oraclePrice: number
  tokenQuantity: number // Quantité de token RWA
  performance: number // %
}

export interface UserPortfolio {
  amountInvested: number // Total USDC investi
  currentValue: number // Valeur actuelle totale
  performance: number // Performance globale %
  breakdown: PortfolioToken[]
}

export const useUserPortfolio = (): UserPortfolio => {
  const { address } = useAccount()
  const { history } = useUserHistory(address, 18)
  const { allocations } = useTokenRegistry()

  return useMemo(() => {
    // Debug: afficher l'historique complet
    console.log(
      '🔍 Portfolio Debug - History:',
      history.map((item) => ({
        type: item.type,
        amount: item.amount,
        date: item.date.toISOString(),
        txHash: item.txHash,
      }))
    )

    // Calculer le total investi (dépôts - retraits totaux)
    const deposits = history.filter((item) => item.type === 'Dépôt')
    const withdrawals = history.filter((item) => item.type === 'Retrait')
    const exitFees = history.filter((item) => item.type === 'Frais de sortie')

    console.log(
      '🔍 Portfolio Debug - Deposits:',
      deposits.map((d) => ({ amount: d.amount, date: d.date.toISOString() }))
    )
    console.log(
      '🔍 Portfolio Debug - Withdrawals:',
      withdrawals.map((w) => ({ amount: w.amount, date: w.date.toISOString() }))
    )
    console.log(
      '🔍 Portfolio Debug - Exit Fees:',
      exitFees.map((f) => ({ amount: f.amount, date: f.date.toISOString() }))
    )

    const totalDeposits = deposits.reduce((sum, item) => sum + item.amount, 0)
    const totalWithdrawalsNet = withdrawals.reduce(
      (sum, item) => sum + item.amount,
      0
    )

    // Ne compter les frais de sortie que s'ils sont liés à un retrait
    // (même transaction ou bloc proche)
    const withdrawalTxHashes = new Set(withdrawals.map((item) => item.txHash))
    const relatedExitFees = exitFees.filter((item) =>
      withdrawalTxHashes.has(item.txHash)
    )

    // Pour les frais de sortie, utiliser le montant du fee, pas le montant total
    const totalExitFees = relatedExitFees.reduce((sum, item) => {
      // Extraire le montant du fee depuis les détails
      const feeMatch = item.details?.match(/Frais appliqué : ([\d.]+) USDC/)
      const feeAmount = feeMatch ? parseFloat(feeMatch[1]) : 0
      return sum + feeAmount
    }, 0)

    // Montant total retiré = montant net reçu + frais de sortie liés
    const totalWithdrawals = totalWithdrawalsNet + totalExitFees
    const amountInvested = totalDeposits - totalWithdrawals

    console.log('🔍 Portfolio Debug - Calculation:', {
      totalDeposits,
      totalWithdrawalsNet,
      totalExitFees,
      totalWithdrawals,
      amountInvested,
    })

    if (amountInvested <= 0 || !allocations.length) {
      console.log('🔍 Portfolio Debug - Returning empty portfolio')
      return {
        amountInvested: 0,
        currentValue: 0,
        performance: 0,
        breakdown: [],
      }
    }

    const breakdown: PortfolioToken[] = []
    let totalCurrentValue = 0

    // Calculer la valeur actuelle pour chaque token
    allocations
      .filter((allocation) => allocation.active)
      .forEach((allocation) => {
        const allocationPercent =
          parseFloat(formatUnits(allocation.weight, 18)) * 100
        const oraclePrice = MOCK_ORACLE_PRICES[allocation.token] || 0
        const amountInvestedInToken = amountInvested * (allocationPercent / 100)
        const tokenQuantity = amountInvestedInToken / oraclePrice
        const currentValue = tokenQuantity * oraclePrice
        const symbol = TOKEN_SYMBOLS[allocation.token] || 'UNKNOWN'

        breakdown.push({
          symbol,
          tokenAddress: allocation.token,
          allocationPercent,
          amountInvested: amountInvestedInToken,
          currentValue,
          oraclePrice,
          tokenQuantity,
          performance:
            oraclePrice > 1
              ? (oraclePrice - 1) * 100
              : (1 - oraclePrice) * -100,
        })

        totalCurrentValue += currentValue
      })

    const performance =
      amountInvested > 0
        ? ((totalCurrentValue - amountInvested) / amountInvested) * 100
        : 0

    return {
      amountInvested,
      currentValue: totalCurrentValue,
      performance,
      breakdown,
    }
  }, [history, allocations])
}
