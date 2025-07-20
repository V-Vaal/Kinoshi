import { useMemo, useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { vaultAddress, mockOracleAddress } from '@/constants'
import { useUserHistory } from '@/utils/useUserHistory'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { mockTokenAddresses } from '@/constants'
import mockPriceFeedAbiJson from '@/abis/MockPriceFeed.abi.json'
import { useRWASnapshot } from './useRWASnapshot'

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
  amountInvested: number // USDC investi
  currentValue: number // USDC actuel
  oraclePrice: number
  tokenQuantity: number // Quantité de token RWA
  performance: number // %
}

export interface UserPortfolio {
  amountInvested: number // Total USDC investi (calculé via historique)
  currentValue: number // Valeur actuelle totale
  performance: number // Performance globale %
  breakdown: PortfolioToken[]
  fallback?: boolean // Indique si on utilise le fallback on-chain
  isFallback?: boolean // Indique si on utilise le fallback temporaire (pas de snapshot)
  warning?: string // Message d'alerte si désynchronisation
}

export const useUserPortfolio = (): UserPortfolio => {
  const { address } = useAccount()
  const { history } = useUserHistory(address, 18)
  const { allocations } = useTokenRegistry()
  const { snapshot, updateSnapshotOnWithdrawal } = useRWASnapshot()
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
  const [referencePrices, setReferencePrices] = useState<
    Record<string, number>
  >({})
  const [currentPortfolioValue, setCurrentPortfolioValue] = useState<
    number | null
  >(null)

  // ✅ LOGIQUE ERC-4626 : convertToAssets(userShares) = (userShares * totalAssets()) / totalSupply()
  // Cette valeur reflète la valeur actuelle du portefeuille avec les plus-values/moins-values
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

          const value = parseFloat(formatUnits(portfolioAssets as bigint, 18))
          setCurrentPortfolioValue(value)
          console.log('🔍 Portfolio Value via convertToAssets:', value, 'USDC')
        } catch (error) {
          console.log('🔍 Portfolio Value Error:', error)
          setCurrentPortfolioValue(null)
        }
      } else {
        setCurrentPortfolioValue(null)
      }
    }

    calculatePortfolioValue()
  }, [userShares])

  // Calculer le fallback si nécessaire (gardé pour compatibilité)
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

  // Fonction pour récupérer les prix oracle on-chain (prix actuels et prix de référence)
  const fetchOraclePrices = useCallback(async () => {
    if (!allocations.length) return

    try {
      const prices: Record<string, number> = {}
      const refPrices: Record<string, number> = {}

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

          // Pour les prix de référence, on utilise les prix actuels de l'Oracle
          // UNIQUEMENT au premier appel (prix initiaux définis au déploiement)
          // Une fois définis, ils ne changent jamais
          if (!referencePrices[allocation.token]) {
            refPrices[allocation.token] = priceFormatted
          } else {
            refPrices[allocation.token] = referencePrices[allocation.token]
          }
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

          // Prix de référence : seulement au premier appel
          if (!referencePrices[allocation.token]) {
            refPrices[allocation.token] = defaultPrices[allocation.token] || 1
          } else {
            refPrices[allocation.token] = referencePrices[allocation.token]
          }
        }
      }

      setOraclePrices(prices)
      setReferencePrices(refPrices)
    } catch (error) {
      console.log('🔍 Oracle Prices Error:', error)
    }
  }, [allocations]) // ✅ Suppression de referencePrices des dépendances

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
      // Forcer un recalcul en refetchant les prix oracle
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
    // Calculer le total investi (dépôts - retraits totaux) - LOGIQUE 1
    const deposits = history.filter((item) => item.type === 'Dépôt')
    const withdrawals = history.filter((item) => item.type === 'Retrait')
    const exitFees = history.filter((item) => item.type === 'Frais de retrait')

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

    // ❌ SUPPRIMÉ : La mise à jour du snapshot doit se faire uniquement dans le composant de retrait
    // Pas ici pour éviter les conflits avec les nouveaux dépôts

    // Vérification croisée : si portfolio vide mais shares > 0
    if (amountInvested <= 0) {
      // Vérifier si c'est vraiment une désynchronisation (pas juste un retrait complet)
      const hasRecentActivity = history.some((item) => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000 // 1 heure
        return item.date.getTime() > oneHourAgo
      })

      // Cas de désynchronisation détecté seulement si pas d'activité récente
      if (fallbackValue && fallbackValue > 0 && !hasRecentActivity) {
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

      // Vraiment vide ou retrait récent
      return {
        amountInvested: 0,
        currentValue: 0,
        performance: 0,
        breakdown: [],
      }
    }

    // ✅ LOGIQUE ERC-4626 : Utiliser convertToAssets(userShares) comme valeur du portefeuille
    if (currentPortfolioValue !== null && currentPortfolioValue > 0) {
      const breakdown: PortfolioToken[] = []

      // Utiliser le snapshot pour les tokenQuantity (affichage seulement)
      if (snapshot && snapshot.items.length > 0) {
        snapshot.items.forEach((item) => {
          const oraclePrice =
            oraclePrices[item.tokenAddress] || item.oraclePrice

          // Calculer la proportion de ce token dans le portefeuille total
          const tokenProportion = item.amountInvested / snapshot.totalInvested
          const currentTokenValue = currentPortfolioValue * tokenProportion

          // Performance = (valeur actuelle - montant investi) / montant investi
          const tokenPerformance =
            item.amountInvested > 0
              ? ((currentTokenValue - item.amountInvested) /
                  item.amountInvested) *
                100
              : 0

          breakdown.push({
            symbol: item.symbol,
            tokenAddress: item.tokenAddress,
            allocationPercent: item.allocationPercent,
            amountInvested: item.amountInvested,
            currentValue: currentTokenValue,
            oraclePrice,
            tokenQuantity: item.tokenQuantity, // Quantité figée au dépôt (affichage)
            performance: tokenPerformance,
          })
        })
      }

      // Performance globale basée sur convertToAssets(userShares)
      const performance =
        amountInvested > 0
          ? ((currentPortfolioValue - amountInvested) / amountInvested) * 100
          : 0

      return {
        amountInvested, // Montant réel via historique
        currentValue: currentPortfolioValue, // ✅ convertToAssets(userShares) - valeur actuelle avec plus-values
        performance,
        breakdown,
        isFallback: false,
      }
    }

    // Fallback temporaire : calculer avec les allocations (pour les nouveaux utilisateurs)
    if (!allocations.length) {
      return {
        amountInvested: 0,
        currentValue: 0,
        performance: 0,
        breakdown: [],
        isFallback: true,
        warning: 'Aucune allocation trouvée.',
      }
    }

    const breakdown: PortfolioToken[] = []
    let totalCurrentValue = 0

    // ⚠️ FALLBACK TEMPORAIRE : Calcul avec allocations + oracle actuel
    allocations
      .filter((allocation) => allocation.active)
      .forEach((allocation) => {
        const allocationPercent =
          parseFloat(formatUnits(allocation.weight, 18)) * 100
        const oraclePrice = oraclePrices[allocation.token] || 0

        // Montant investi dans ce token
        const amountInvestedInToken = amountInvested * (allocationPercent / 100)

        // ⚠️ FALLBACK : Calculer tokenQuantity avec prix actuel (inexact)
        const tokenQuantity = amountInvestedInToken / oraclePrice

        // Valeur actuelle
        const currentValue = tokenQuantity * oraclePrice

        const symbol = getTokenSymbol(allocation.token)

        // Performance
        const tokenPerformance =
          amountInvestedInToken > 0
            ? ((currentValue - amountInvestedInToken) / amountInvestedInToken) *
              100
            : 0

        breakdown.push({
          symbol,
          tokenAddress: allocation.token,
          allocationPercent,
          amountInvested: amountInvestedInToken,
          currentValue,
          oraclePrice,
          tokenQuantity,
          performance: tokenPerformance,
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
      isFallback: true,
      warning:
        'Calcul temporaire : les quantités RWA sont estimées. Effectuez un dépôt pour un calcul précis.',
    }
  }, [
    history,
    allocations,
    oraclePrices,
    referencePrices,
    fallbackValue,
    snapshot,
    currentPortfolioValue,
  ])
}
