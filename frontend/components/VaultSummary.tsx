'use client'

import { useAccount } from 'wagmi'
import { useVault } from '@/context/VaultContext'
import { useUserHistory } from '@/utils/useUserHistory'
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
import { mockTokenAddresses, vaultAddress } from '@/constants'
import mockUSDCAbiJson from '@/abis/MockUSDC.abi.json'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'
import { Wallet, TrendingUp, Target, DollarSign } from 'lucide-react'

interface VaultSummaryProps {
  className?: string
}

const VaultSummary: React.FC<VaultSummaryProps> = ({ className }) => {
  const { address } = useAccount()
  const { userShares, assetDecimals } = useVault()
  const { history } = useUserHistory(address, 6)

  const [userBalance, setUserBalance] = useState<bigint | null>(null)
  const [portfolioValue, setPortfolioValue] = useState<string>('0')

  const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi
  const usdcAbi = (mockUSDCAbiJson.abi ?? mockUSDCAbiJson) as Abi

  // ✅ Récupère le solde mUSDC de l'utilisateur
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
    return () => window.removeEventListener('vault-refresh', handler)
  }, [address, usdcAbi])

  // ✅ Calcule la valeur du portefeuille via convertToAssets
  useEffect(() => {
    const fetchPortfolioValue = async () => {
      if (!userShares || !assetDecimals || userShares === 0n) {
        setPortfolioValue('0')
        return
      }

      try {
        const result = await readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'convertToAssets',
          args: [userShares],
        })

        const formatted = formatUnits(result as bigint, assetDecimals)
        setPortfolioValue(formatted)
      } catch {
        setPortfolioValue('0')
      }
    }

    fetchPortfolioValue()
    const handler = () => fetchPortfolioValue()
    window.addEventListener('vault-refresh', handler)
    return () => window.removeEventListener('vault-refresh', handler)
  }, [userShares, assetDecimals, vaultAbi])

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return numValue
      .toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'code',
      })
      .replace('USD', 'USDC')
  }

  // Calculer le total investi à partir de l'historique
  const totalInvested = history
    .filter((item) => item.type === 'Dépôt')
    .reduce((sum, item) => sum + item.amount, 0)

  // Calculer la performance
  const calculatePerformance = () => {
    if (!portfolioValue || totalInvested === 0)
      return { value: 0, percentage: 0, isPositive: false }

    const currentValue = parseFloat(portfolioValue)
    const performance = currentValue - totalInvested
    const percentage =
      totalInvested > 0 ? (performance / totalInvested) * 100 : 0

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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Solde mUSDC */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Solde USDC (test)
              </p>
              <p className="text-lg font-bold text-blue-900">
                {userBalance === null
                  ? '...'
                  : formatCurrency(formatUnits(userBalance, 6))}
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
                {totalInvested === 0 ? '...' : formatCurrency(totalInvested)}
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
                {portfolioValue === '0'
                  ? '...'
                  : formatCurrency(portfolioValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Performance */}
        {totalInvested > 0 && (
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
                  {formatCurrency(performance.value)}
                </p>
                <p
                  className={`text-sm ${performance.isPositive ? 'text-green-700' : 'text-red-700'}`}
                >
                  {performance.isPositive ? '+' : ''}
                  {performance.percentage.toFixed(2)}%
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
