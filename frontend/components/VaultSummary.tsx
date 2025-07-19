'use client'

import { useAccount } from 'wagmi'
import { useUserHistory } from '@/utils/useUserHistory'
import { useVault } from '@/context/VaultContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui'
import { useEffect, useState } from 'react'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { mockTokenAddresses } from '@/constants'
import mockUSDCAbiJson from '@/abis/MockUSDC.abi.json'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'
import { Wallet, TrendingUp, Target, DollarSign, RefreshCw } from 'lucide-react'
import { formatUSDC, formatPercentage } from '@/utils/formatting'

interface VaultSummaryProps {
  className?: string
}

// Helper pour formater les nombres en USDC
const formatNumberAsUSDC = (value: number): string => {
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

const VaultSummary: React.FC<VaultSummaryProps> = ({ className }) => {
  const { address } = useAccount()
  const { history } = useUserHistory(address, 18)
  const { 
    userPortfolioValue, 
    userPortfolioValueFormatted, 
    userShares,
    totalAssets,
    totalSupply,
    assetDecimals,
    refreshUserData 
  } = useVault()

  const [userBalance, setUserBalance] = useState<bigint | null>(null)
  const [localTotalInvested, setLocalTotalInvested] = useState<number>(0)
  const [pendingDeposits, setPendingDeposits] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const usdcAbi = (mockUSDCAbiJson.abi ?? mockUSDCAbiJson) as Abi

  // ✅ Récupère le solde USDC de l'utilisateur
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return setUserBalance(null)

      try {
        const balance = await readContract(wagmiConfig, {
          abi: usdcAbi,
          address: mockTokenAddresses.mUSDC as `0x${string}`,
          functionName: 'balanceOf',
          args: [address],
        })
        setUserBalance(balance as bigint)
        console.log('💰 VaultSummary - User balance:', formatUSDC(balance as bigint))
      } catch (error) {
        console.error('❌ VaultSummary - Error fetching balance:', error)
        setUserBalance(null)
      }
    }

    fetchBalance()
    const handler = () => fetchBalance()
    window.addEventListener('vault-refresh', handler)
    window.addEventListener('user-data-refresh', handler)
    return () => {
      window.removeEventListener('vault-refresh', handler)
      window.removeEventListener('user-data-refresh', handler)
    }
  }, [address, usdcAbi])

  // ✅ Gestion du total investi local pour refresh immédiat
  useEffect(() => {
    const totalFromHistory = history
      .filter((item) => item.type === 'Dépôt')
      .reduce((sum, item) => sum + item.amount, 0)

    // Total = historique blockchain + dépôts en attente
    setLocalTotalInvested(totalFromHistory + pendingDeposits)
    console.log('📊 VaultSummary - Total invested:', totalFromHistory + pendingDeposits)
  }, [history, pendingDeposits])

  // ✅ Écouter les dépôts en cours
  useEffect(() => {
    const handleDepositStart = (event: CustomEvent) => {
      const amount = event.detail?.amount
      if (amount) {
        setPendingDeposits((prev) => prev + amount)
        console.log('📈 VaultSummary - Deposit started:', amount)
      }
    }

    const handleDepositSuccess = () => {
      // Réinitialiser les dépôts en attente après succès
      setPendingDeposits(0)
      console.log('✅ VaultSummary - Deposit success')
    }

    const handleDepositError = () => {
      // Réinitialiser les dépôts en attente après erreur
      setPendingDeposits(0)
      console.log('❌ VaultSummary - Deposit error')
    }

    window.addEventListener(
      'deposit-start',
      handleDepositStart as EventListener
    )
    window.addEventListener('deposit-success', handleDepositSuccess)
    window.addEventListener('deposit-error', handleDepositError)

    return () => {
      window.removeEventListener(
        'deposit-start',
        handleDepositStart as EventListener
      )
      window.removeEventListener('deposit-success', handleDepositSuccess)
      window.removeEventListener('deposit-error', handleDepositError)
    }
  }, [])

  // Fonction de refresh manuel
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshUserData()
      console.log('🔄 VaultSummary - Manual refresh completed')
    } catch (error) {
      console.error('❌ VaultSummary - Manual refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculer la performance
  const calculatePerformance = () => {
    const currentValue = userPortfolioValueFormatted 
      ? parseFloat(userPortfolioValueFormatted) 
      : 0
    
    if (!currentValue || localTotalInvested === 0) {
      return { value: 0, percentage: 0, isPositive: false }
    }

    const performance = currentValue - localTotalInvested
    const percentage = localTotalInvested > 0 ? (performance / localTotalInvested) * 100 : 0

    return {
      value: performance,
      percentage,
      isPositive: performance >= 0,
    }
  }

  const performance = calculatePerformance()

  // Debug info
  console.log('📊 VaultSummary - Debug:', {
    userPortfolioValue: userPortfolioValue ? formatUnits(userPortfolioValue, assetDecimals || 18) : 'null',
    userPortfolioValueFormatted,
    userShares: userShares ? formatUnits(userShares, 18) : 'null',
    totalAssets: totalAssets ? formatUnits(totalAssets, assetDecimals || 18) : 'null',
    totalSupply: totalSupply ? formatUnits(totalSupply, 18) : 'null',
    localTotalInvested,
    performance: performance.value
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Résumé de votre investissement
          <Badge variant="secondary">Test</Badge>
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
      <CardContent className="space-y-6">
        {/* Solde USDC */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Solde USDC (test)
              </p>
              <p className="text-lg font-bold text-blue-900">
                {userBalance === null ? '...' : formatUSDC(userBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Total investi */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total investi</p>
              <p className="text-lg font-bold text-green-900">
                {localTotalInvested === 0
                  ? '...'
                  : formatNumberAsUSDC(localTotalInvested)}
              </p>
            </div>
          </div>
        </div>

        {/* Valeur actuelle du portefeuille */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Valeur actuelle du portefeuille
              </p>
              <p className="text-lg font-bold text-purple-900">
                {userPortfolioValueFormatted 
                  ? formatNumberAsUSDC(parseFloat(userPortfolioValueFormatted))
                  : '...'}
              </p>
            </div>
          </div>
        </div>

        {/* Performance */}
        {localTotalInvested > 0 && (
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              {performance.isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p
                  className={`text-lg font-bold ${performance.isPositive ? 'text-green-900' : 'text-red-900'}`}
                >
                  {performance.isPositive ? '+' : ''}
                  {formatNumberAsUSDC(performance.value)}
                </p>
                <p
                  className={`text-sm ${performance.isPositive ? 'text-green-700' : 'text-red-700'}`}
                >
                  {performance.isPositive ? '+' : ''}
                  {formatPercentage(performance.percentage / 100)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug info (à retirer en prod) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-gray-50 rounded-lg text-xs">
            <p className="font-medium mb-2">Debug Info:</p>
            <p>Shares: {userShares ? formatUnits(userShares, 18) : 'null'}</p>
            <p>Total Assets: {totalAssets ? formatUnits(totalAssets, assetDecimals || 18) : 'null'}</p>
            <p>Total Supply: {totalSupply ? formatUnits(totalSupply, 18) : 'null'}</p>
            <p>Portfolio Value: {userPortfolioValueFormatted || 'null'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VaultSummary
