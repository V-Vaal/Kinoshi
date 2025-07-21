import { useMemo, useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { vaultAddress, mockOracleAddress } from '@/constants'
import { useUserHistory } from '@/hooks/useUserHistory'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { mockTokenAddresses } from '@/constants'
import mockPriceFeedAbiJson from '@/abis/MockPriceFeed.abi.json'
import {
  fromWei,
  isRealisticValue,
  debugDecimalCalculation,
} from '@/utils/decimalUtils'

// ABI du Mock Price Feed
const mockPriceFeedAbi = (mockPriceFeedAbiJson.abi ??
  mockPriceFeedAbiJson) as readonly unknown[]

// Fonction utilitaire pour obtenir le symbole du token
function getTokenSymbol(tokenAddress: string): string {
  const TOKEN_SYMBOLS: Record<string, string> = {
    [mockTokenAddresses.mGOLD]: 'GOLD',
    [mockTokenAddresses.mBTC]: 'BTC',
    [mockTokenAddresses.mBONDS]: 'BONDS',
    [mockTokenAddresses.mEQUITY]: 'EQUITY',
  }
  return TOKEN_SYMBOLS[tokenAddress] || 'UNKNOWN'
}

export interface PortfolioToken {
  symbol: string
  tokenAddress: string
  allocationPercent: number
  amountInvested: number // USDC investi (via historique)
  currentValue: number // USDC actuel (via convertToAssets)
  oraclePrice: number
  tokenQuantity: number // Quantité réelle détenue par l'utilisateur
  performance: number // %
}

export interface UserPortfolio {
  amountInvested: number // Total USDC investi (calculé via historique)
  currentValue: number // Valeur actuelle totale (convertToAssets)
  performance: number // Performance globale %
  breakdown: PortfolioToken[]
  warning?: string // Message d'alerte si désynchronisation
}

export const useUserPortfolio = (): UserPortfolio => {
  const { address } = useAccount()
  const { history } = useUserHistory(address, 18)
  const { allocations } = useTokenRegistry()
  const [userShares, setUserShares] = useState<bigint | null>(null)
  const [currentPortfolioValue, setCurrentPortfolioValue] = useState<
    number | null
  >(null)
  const [oraclePrices, setOraclePrices] = useState<Record<string, number>>({})
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null)
  const [totalAssetsValue, setTotalAssetsValue] = useState<number | null>(null)

  // ✅ Récupérer les shares de l'utilisateur
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
        console.log('🔍 User Shares:', formatUnits(shares as bigint, 18))
      } catch (error) {
        console.log('🔍 User Shares Error:', error)
        setUserShares(null)
      }
    }
    fetchUserShares()
  }, [address])

  // ✅ Récupérer le totalSupply et totalAssets du vault
  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        // Récupérer totalSupply
        const supply = await readContract(wagmiConfig, {
          abi: [
            {
              inputs: [],
              name: 'totalSupply',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: vaultAddress as `0x${string}`,
          functionName: 'totalSupply',
        })

        setTotalSupply(supply as bigint)
        console.log('🔍 Total Supply:', formatUnits(supply as bigint, 18))

        // Récupérer totalAssets
        const totalAssets = await readContract(wagmiConfig, {
          abi: [
            {
              inputs: [],
              name: 'totalAssets',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: vaultAddress as `0x${string}`,
          functionName: 'totalAssets',
        })

        const totalAssetsFormatted = fromWei(totalAssets as bigint)
        setTotalAssetsValue(totalAssetsFormatted)
        console.log(
          '🔍 Total Assets (from Vault):',
          totalAssetsFormatted,
          'USDC'
        )
      } catch (error) {
        console.log('🔍 Vault Data Error:', error)
        setTotalSupply(null)
        setTotalAssetsValue(null)
      }
    }
    fetchVaultData()
  }, [])

  // ✅ LOGIQUE ERC-4626 : convertToAssets(userShares) = (userShares * totalAssets()) / totalSupply()
  useEffect(() => {
    const calculatePortfolioValue = async () => {
      if (userShares && userShares > 0n) {
        try {
          const portfolioAssets = await readContract(wagmiConfig, {
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

          const value = fromWei(portfolioAssets as bigint)
          setCurrentPortfolioValue(value)
          console.log('🔍 Portfolio Value via convertToAssets:', value, 'USDC')
        } catch (error) {
          console.log('🔍 Portfolio Value Error:', error)
          setCurrentPortfolioValue(null)
        }
      } else {
        setCurrentPortfolioValue(0)
      }
    }

    calculatePortfolioValue()
  }, [userShares])

  // ✅ ERC-4626 : Plus besoin de récupérer les balances du vault
  // La répartition est calculée par convertToAssets(userShares) et les allocations

  // ✅ Fonction pour récupérer les prix oracle on-chain
  const fetchOraclePrices = useCallback(async () => {
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
          // ✅ CORRECTION : Les prix oracle sont en 18 décimales mais représentent des USDC
          // Donc on les convertit en float pour les calculs
          const priceFormatted = parseFloat(formatUnits(price, decimals))
          prices[allocation.token] = priceFormatted
          console.log(
            '🔍 Oracle Price for',
            getTokenSymbol(allocation.token),
            ':',
            priceFormatted,
            'USDC'
          )
        } catch (error) {
          console.log(
            '🔍 Oracle Price Error for token:',
            allocation.token,
            error
          )
          // Fallback aux prix par défaut si erreur
          const defaultPrices: Record<string, number> = {
            [mockTokenAddresses.mGOLD]: 3355, // Prix réel du déploiement
            [mockTokenAddresses.mBTC]: 118800, // Prix réel du déploiement
            [mockTokenAddresses.mBONDS]: 95.78, // Prix réel du déploiement
            [mockTokenAddresses.mEQUITY]: 623.62, // Prix réel du déploiement
          }
          prices[allocation.token] = defaultPrices[allocation.token] || 1
        }
      }

      setOraclePrices(prices)
    } catch (error) {
      console.log('🔍 Oracle Prices Error:', error)
    }
  }, [allocations])

  // Récupérer les prix oracle on-chain
  useEffect(() => {
    fetchOraclePrices()
  }, [allocations])

  // Refresh automatique des prix oracle toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOraclePrices()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [fetchOraclePrices])

  // Écouter les événements de refresh du portfolio
  useEffect(() => {
    const handlePortfolioRefresh = () => {
      fetchOraclePrices()

      // Forcer un recalcul de la valeur du portefeuille
      if (userShares && userShares > 0n) {
        const recalculatePortfolioValue = async () => {
          try {
            const portfolioAssets = await readContract(wagmiConfig, {
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

            const value = parseFloat(formatUnits(portfolioAssets as bigint, 18))
            setCurrentPortfolioValue(value)
            console.log('🔍 Portfolio Value refreshed:', value)
          } catch (error) {
            console.log('🔍 Portfolio Value refresh error:', error)
          }
        }
        recalculatePortfolioValue()
      }
    }

    window.addEventListener('portfolio-refresh', handlePortfolioRefresh)
    return () => {
      window.removeEventListener('portfolio-refresh', handlePortfolioRefresh)
    }
  }, [fetchOraclePrices, userShares])

  return useMemo(() => {
    // ✅ Calculer le total investi (dépôts - retraits totaux) via historique
    const deposits = history.filter((item) => item.type === 'Dépôt')
    const withdrawals = history.filter((item) => item.type === 'Retrait')
    const exitFees = history.filter((item) => item.type === 'Frais de retrait')

    const totalDeposits = deposits.reduce((sum, item) => sum + item.amount, 0)
    const totalWithdrawalsNet = withdrawals.reduce(
      (sum, item) => sum + item.amount,
      0
    )
    const totalExitFees = exitFees.reduce((sum, item) => sum + item.amount, 0)
    const totalWithdrawals = totalWithdrawalsNet + totalExitFees
    const amountInvested = totalDeposits - totalWithdrawals

    // ✅ Utiliser convertToAssets(userShares) comme valeur du portefeuille
    const currentValue = currentPortfolioValue || 0

    // ✅ ERC-4626 : Utiliser uniquement convertToAssets(userShares) comme source de vérité
    // La répartition est calculée par le smart contract, pas par le frontend
    const breakdown: PortfolioToken[] = []

    if (userShares && userShares > 0n && currentValue > 0) {
      // ✅ ERC-4626 : La valeur totale est convertToAssets(userShares)
      // La répartition se fait selon les allocations définies dans le smart contract

      allocations
        .filter((allocation) => allocation.active)
        .forEach((allocation) => {
          const oraclePrice = oraclePrices[allocation.token] || 0

          // ✅ Calculer le pourcentage d'allocation (pour affichage)
          const allocationPercent =
            parseFloat(formatUnits(allocation.weight, 18)) * 100

          // ✅ Calculer le montant USDC investi dans ce token (approximatif via historique)
          const amountInvestedInToken =
            amountInvested * (allocationPercent / 100)

          // ✅ ERC-4626 : La valeur actuelle de ce token = portion de convertToAssets(userShares)
          const userTokenValue = currentValue * (allocationPercent / 100)

          // ✅ ERC-4626 : Quantité de tokens = valeur / prix oracle
          const userTokenQuantity =
            oraclePrice > 0 ? userTokenValue / oraclePrice : 0

          // 🔍 DEBUG: Vérifier les valeurs ERC-4626
          debugDecimalCalculation(
            `ERC-4626 calculation for ${getTokenSymbol(allocation.token)}`,
            {
              allocationPercent: allocationPercent + '%',
              amountInvestedInToken: amountInvestedInToken + ' USDC',
              userTokenValue: userTokenValue + ' USDC',
              oraclePrice: oraclePrice + ' USDC',
              userTokenQuantity: userTokenQuantity,
              totalPortfolioValue: currentValue + ' USDC',
            }
          )

          // ✅ Calculer la performance
          const tokenPerformance =
            amountInvestedInToken > 0
              ? ((userTokenValue - amountInvestedInToken) /
                  amountInvestedInToken) *
                100
              : 0

          breakdown.push({
            symbol: getTokenSymbol(allocation.token),
            tokenAddress: allocation.token,
            allocationPercent,
            amountInvested: amountInvestedInToken,
            currentValue: userTokenValue,
            oraclePrice,
            tokenQuantity: userTokenQuantity,
            performance: tokenPerformance,
          })
        })
    }

    // ✅ Calculer la performance globale
    const performance =
      amountInvested > 0
        ? ((currentValue - amountInvested) / amountInvested) * 100
        : 0

    // ✅ Vérifier la cohérence ERC-4626
    const calculatedTotalValue = breakdown.reduce(
      (sum, item) => sum + item.currentValue,
      0
    )
    const isConsistent = Math.abs(calculatedTotalValue - currentValue) < 0.01 // Tolérance de 1 centime

    // 🔍 DEBUG: Vérification ERC-4626 complète
    if (totalAssetsValue !== null) {
      console.log('🔍 ERC-4626 Verification:', {
        totalAssetsFromVault: totalAssetsValue + ' USDC',
        convertToAssetsUserShares: currentValue + ' USDC',
        calculatedSumOfBreakdown: calculatedTotalValue + ' USDC',
        userPortion:
          userShares && totalSupply
            ? Number(userShares) / Number(totalSupply)
            : 0,
        isConsistent: isConsistent,
      })
    }

    return {
      amountInvested,
      currentValue,
      performance,
      breakdown,
      warning:
        !isConsistent && currentValue > 0
          ? 'Désynchronisation détectée entre la valeur totale et la répartition des actifs.'
          : undefined,
    }
  }, [
    history,
    allocations,
    oraclePrices,
    userShares,
    totalSupply,
    currentPortfolioValue,
  ])
}
