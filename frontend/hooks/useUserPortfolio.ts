import { useMemo, useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { vaultAddress, mockOracleAddress } from '@/constants'
import { useUserHistory } from '@/utils/useUserHistory'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { mockTokenAddresses } from '@/constants'
import mockPriceFeedAbiJson from '@/abis/MockPriceFeed.abi.json'

// ABI du Mock Price Feed
const mockPriceFeedAbi = (mockPriceFeedAbiJson.abi ??
  mockPriceFeedAbiJson) as readonly unknown[]

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
  fallback?: boolean // Indique si on utilise le fallback on-chain
  warning?: string // Message d'alerte si désynchronisation
}

export const useUserPortfolio = (): UserPortfolio => {
  const { address } = useAccount()
  const { history } = useUserHistory(address, 18)
  const { allocations } = useTokenRegistry()
  const [userShares, setUserShares] = useState<bigint | null>(null)

  // Récupérer les shares de l'utilisateur pour le fallback
  useEffect(() => {
    const fetchUserShares = async () => {
      if (!address) {
        setUserShares(null)
        return
      }
      try {
        const shares = await readContract(wagmiConfig, {
          abi: [
            {
              inputs: [{ name: 'account', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: vaultAddress as `0x${string}`,
          functionName: 'balanceOf',
          args: [address],
        })

        setUserShares(shares as bigint)

        console.log('🔍 User Shares Debug:', {
          shares: shares.toString(),
        })
      } catch (error) {
        console.log('🔍 User Shares Error:', error)
        setUserShares(null)
      }
    }
    fetchUserShares()
  }, [address])

  const [fallbackValue, setFallbackValue] = useState<number | null>(null)
  const [oraclePrices, setOraclePrices] = useState<Record<string, number>>({})

  // Calculer le fallback si nécessaire
  useEffect(() => {
    const calculateFallback = async () => {
      if (userShares && userShares > 0n) {
        try {
          const fallbackAssets = await readContract(wagmiConfig, {
            abi: [
              {
                inputs: [{ name: 'shares', type: 'uint256' }],
                name: 'convertToAssets',
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            address: vaultAddress as `0x${string}`,
            functionName: 'convertToAssets',
            args: [userShares],
          })

          const value = parseFloat(formatUnits(fallbackAssets as bigint, 18))
          setFallbackValue(value)

          console.log('🔍 Fallback Debug:', {
            shares: userShares.toString(),
            fallbackAssets: fallbackAssets.toString(),
            fallbackValue: value,
          })
        } catch (error) {
          console.log('🔍 Fallback Error:', error)
          setFallbackValue(null)
        }
      } else {
        setFallbackValue(null)
      }
    }

    calculateFallback()
  }, [userShares])

  // Récupérer les prix oracle on-chain
  useEffect(() => {
    const fetchOraclePrices = async () => {
      if (!allocations.length) return

      try {
        const prices: Record<string, number> = {}

        for (const allocation of allocations.filter((a) => a.active)) {
          try {
            const result = await readContract(wagmiConfig, {
              abi: mockPriceFeedAbi,
              address: mockOracleAddress as `0x${string}`,
              functionName: 'getPrice',
              args: [allocation.token],
            })

            const [price, decimals] = result as [bigint, number]
            const priceFormatted = parseFloat(formatUnits(price, decimals))
            prices[allocation.token] = priceFormatted

            console.log('🔍 Oracle Price Debug:', {
              token: allocation.token,
              price: price.toString(),
              decimals,
              priceFormatted,
            })
          } catch (error) {
            console.log(
              '🔍 Oracle Price Error for token:',
              allocation.token,
              error
            )
            // Fallback aux prix par défaut si erreur
            const defaultPrices: Record<string, number> = {
              [mockTokenAddresses.mGOLD]: 2000,
              [mockTokenAddresses.mBTC]: 45000,
              [mockTokenAddresses.mBONDS]: 100,
              [mockTokenAddresses.mEQUITY]: 50,
            }
            prices[allocation.token] = defaultPrices[allocation.token] || 1
          }
        }

        setOraclePrices(prices)
      } catch (error) {
        console.log('🔍 Oracle Prices Error:', error)
      }
    }

    fetchOraclePrices()
  }, [allocations])

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

    // Compter tous les frais de sortie (ils sont maintenant correctement calculés)
    const totalExitFees = exitFees.reduce((sum, item) => sum + item.amount, 0)

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

    // Vérification croisée : si portfolio vide mais shares > 0
    if (amountInvested <= 0) {
      console.log('🔍 Portfolio Debug - Empty portfolio from events')

      // Cas de désynchronisation détecté
      if (fallbackValue && fallbackValue > 0) {
        console.log(
          '🔍 Portfolio Debug - Desync detected, using on-chain fallback'
        )
        return {
          amountInvested: fallbackValue,
          currentValue: fallbackValue,
          performance: 0,
          breakdown: [],
          fallback: true,
          warning:
            'Désynchronisation détectée : certains montants sont estimés à partir de la blockchain.',
        }
      }

      // Vraiment vide
      return {
        amountInvested: 0,
        currentValue: 0,
        performance: 0,
        breakdown: [],
      }
    }

    if (!allocations.length) {
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
        const oraclePrice = oraclePrices[allocation.token] || 0
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
  }, [history, allocations, oraclePrices])
}
