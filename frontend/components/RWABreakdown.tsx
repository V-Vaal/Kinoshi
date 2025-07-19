import React, { useEffect, useState } from 'react'
import { useRWA } from '@/context/RWAContext'
import { useVault } from '@/context/VaultContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Coins, RefreshCw } from 'lucide-react'
import { formatUnits } from 'viem'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { mockTokenAddresses } from '@/constants'
import mockUSDCAbiJson from '@/abis/MockUSDC.abi.json'
import type { Abi } from 'viem'
import { formatQuantity, formatPercentage } from '@/utils/formatting'

// Types pour les balances RWA réelles
interface RealRWABalance {
  symbol: string
  tokenAddress: string
  balance: bigint
  decimals: number
  price: number // Prix en USDC
  value: number // Valeur en USDC
  percent: number // Pourcentage d'allocation
}

// Helper pour formater les valeurs en USDC
const formatValueAsUSDC = (value: number): string => {
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

const RWABreakdown: React.FC = () => {
  const { rwaBalances, totalValue, isLoading, error, refreshRWABalances } = useRWA()
  const { userPortfolioValue, userPortfolioValueFormatted, refreshUserData } = useVault()
  const [realRWABalances, setRealRWABalances] = useState<RealRWABalance[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Récupérer les vraies balances des tokens RWA
  const fetchRealRWABalances = async () => {
    if (!userPortfolioValue || userPortfolioValue === 0n) {
      setRealRWABalances([])
      return
    }

    setIsRefreshing(true)
    try {
      console.log('🔄 Fetching real RWA balances...')
      
      const tokenAddresses = [
        mockTokenAddresses.mGOLD,
        mockTokenAddresses.mBTC,
        mockTokenAddresses.mBONDS,
        mockTokenAddresses.mEQUITY
      ]

      const tokenSymbols = ['GOLD', 'BTC', 'BONDS', 'EQUITY']
      const tokenDecimals = [18, 18, 18, 18] // Tous les tokens ont 18 décimales
      
      // Prix fictifs en USDC (à remplacer par un oracle en prod)
      const tokenPrices = [2000, 45000, 100, 50] // GOLD, BTC, BONDS, EQUITY

      const balances = await Promise.all(
        tokenAddresses.map(async (address, index) => {
          try {
            const balance = await readContract(wagmiConfig, {
              abi: mockUSDCAbiJson.abi as Abi,
              address: address as `0x${string}`,
              functionName: 'balanceOf',
              args: [mockTokenAddresses.mUSDC as `0x${string}`], // Balance du vault
            }) as bigint

            const balanceNumber = parseFloat(formatUnits(balance, tokenDecimals[index]))
            const price = tokenPrices[index]
            const value = balanceNumber * price

            return {
              symbol: tokenSymbols[index],
              tokenAddress: address,
              balance,
              decimals: tokenDecimals[index],
              price,
              value,
              percent: 0 // Sera calculé après
            }
          } catch (error) {
            console.error(`❌ Error fetching ${tokenSymbols[index]} balance:`, error)
            return null
          }
        })
      )

      const validBalances = balances.filter(Boolean) as RealRWABalance[]
      const totalValueSum = validBalances.reduce((sum, item) => sum + item.value, 0)

      // Calculer les pourcentages
      const balancesWithPercent = validBalances.map(item => ({
        ...item,
        percent: totalValueSum > 0 ? (item.value / totalValueSum) * 100 : 0
      }))

      console.log('📊 Real RWA balances:', balancesWithPercent)
      setRealRWABalances(balancesWithPercent)
    } catch (error) {
      console.error('❌ Error fetching real RWA balances:', error)
      setRealRWABalances([])
    } finally {
      setIsRefreshing(false)
    }
  }

  // Rafraîchir quand le portefeuille change
  useEffect(() => {
    fetchRealRWABalances()
  }, [userPortfolioValue])

  // Fonction de refresh manuel
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refreshUserData(),
        refreshRWABalances(),
        fetchRealRWABalances()
      ])
      console.log('✅ RWABreakdown - Manual refresh completed')
    } catch (error) {
      console.error('❌ RWABreakdown - Manual refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading || isRefreshing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Répartition de vos actifs (RWA)
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-auto p-1 hover:bg-gray-100 rounded"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Chargement de la répartition...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Répartition de vos actifs (RWA)
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-auto p-1 hover:bg-gray-100 rounded"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-8">Erreur : {error}</div>
        </CardContent>
      </Card>
    )
  }

  // Utiliser les vraies balances si disponibles, sinon les données du contexte
  const displayBalances = realRWABalances.length > 0 ? realRWABalances : rwaBalances
  const displayTotalValue = realRWABalances.length > 0 
    ? realRWABalances.reduce((sum, item) => sum + item.value, 0)
    : totalValue

  if (displayBalances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Répartition de vos actifs (RWA)
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-auto p-1 hover:bg-gray-100 rounded"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {userPortfolioValue && userPortfolioValue > 0n 
              ? 'Aucun actif RWA trouvé dans votre portefeuille.'
              : 'Votre portefeuille est vide. Effectuez un dépôt pour voir la répartition RWA.'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-[var(--kinoshi-accent)]" />
          Répartition de vos actifs (RWA)
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-auto p-1 hover:bg-gray-100 rounded"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total de la valeur RWA */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              Valeur totale des RWA
            </span>
            <span className="text-lg font-bold text-blue-900">
              {formatValueAsUSDC(displayTotalValue)}
            </span>
          </div>
        </div>

        {/* Détail par token */}
        <div className="space-y-3">
          {displayBalances.map((item) => (
            <div key={item.tokenAddress} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="min-w-[70px]">
                    {item.symbol}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatQuantity(item.balance, item.decimals)} {item.symbol}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatValueAsUSDC(item.value)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPercentage(item.percent / 100)}
                  </div>
                </div>
              </div>
              <Progress value={item.percent} className="h-2" />
            </div>
          ))}
        </div>

        {/* Debug info (à retirer en prod) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-gray-50 rounded-lg text-xs">
            <p className="font-medium mb-2">Debug Info:</p>
            <p>User Portfolio Value: {userPortfolioValueFormatted || 'null'}</p>
            <p>Real RWA Balances: {realRWABalances.length}</p>
            <p>Context RWA Balances: {rwaBalances.length}</p>
            <p>Display Total Value: {displayTotalValue}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RWABreakdown
