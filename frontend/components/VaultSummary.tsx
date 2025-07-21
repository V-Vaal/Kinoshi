'use client'

import { useAccount } from 'wagmi'
import { useUserHistory } from '@/hooks/useUserHistory'
import { useVault } from '@/context/VaultContext'
import { useUserPortfolio } from '@/hooks/useUserPortfolio'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
} from '@/components/ui'
import { useEffect, useState } from 'react'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { mockTokenAddresses } from '@/constants'
import mockUSDCAbiJson from '@/abis/MockUSDC.abi.json'

import type { Abi } from 'viem'
import { Wallet, TrendingUp, Target, DollarSign, RefreshCw } from 'lucide-react'
import { formatUSDC, formatPercentage } from '@/utils/formatting'
import { formatUSDCValue } from '@/utils/formatting'

interface VaultSummaryProps {
  className?: string
}

// Helper pour formater les nombres en USDC (remplacé par formatUSDCValue)
const formatNumberAsUSDC = formatUSDCValue

const VaultSummary: React.FC<VaultSummaryProps> = ({ className }) => {
  const { address } = useAccount()
  const { refetchHistory } = useUserHistory(address, 18)
  const { refreshUserData } = useVault()
  const { amountInvested, currentValue, warning } = useUserPortfolio()

  const [userBalance, setUserBalance] = useState<bigint | null>(null)
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
      } catch {
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

  // ✅ Calculer le total investi avec les dépôts en attente
  const totalInvestedWithPending = amountInvested + pendingDeposits

  // ✅ Écouter les dépôts en cours
  useEffect(() => {
    const handleDepositStart = (event: CustomEvent) => {
      const amount = event.detail?.amount
      if (amount) {
        setPendingDeposits((prev) => prev + amount)
      }
    }

    const handleDepositSuccess = () => {
      // Réinitialiser les dépôts en attente après succès
      setPendingDeposits(0)

      // Refetch l'historique pour avoir les nouvelles données
      setTimeout(() => {
        refetchHistory()
      }, 2000) // Petit délai pour laisser le temps à la blockchain
    }

    const handleDepositError = () => {
      // Réinitialiser les dépôts en attente après erreur
      setPendingDeposits(0)
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
  }, [refetchHistory])

  // Fonction de refresh manuel
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshUserData(), refetchHistory()])
    } catch {
      // Erreur silencieuse
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculer la performance
  const calculatePerformance = () => {
    if (!currentValue || totalInvestedWithPending === 0) {
      return { value: 0, percentage: 0, isPositive: false }
    }

    const performance = currentValue - totalInvestedWithPending
    const percentage =
      totalInvestedWithPending > 0
        ? (performance / totalInvestedWithPending) * 100
        : 0

    return {
      value: performance,
      percentage,
      isPositive: performance >= 0,
    }
  }

  const performance = calculatePerformance()

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
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerte de désynchronisation */}
        {warning && (
          <Alert>
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}

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
                {totalInvestedWithPending === 0
                  ? '...'
                  : formatNumberAsUSDC(totalInvestedWithPending)}
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
                {currentValue === 0 ? '...' : formatNumberAsUSDC(currentValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Performance - affichée seulement si amountInvested > 0 */}
        {totalInvestedWithPending > 0 && (
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
      </CardContent>
    </Card>
  )
}

export default VaultSummary
