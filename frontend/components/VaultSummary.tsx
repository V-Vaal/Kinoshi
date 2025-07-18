'use client'

import { useAccount } from 'wagmi'
import { useUserInvestmentStats } from '@/utils/useUserInvestmentStats'
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
import { Wallet, TrendingUp, Coins, Target } from 'lucide-react'

interface VaultSummaryProps {
  className?: string
}

const VaultSummary: React.FC<VaultSummaryProps> = ({ className }) => {
  const { address } = useAccount()
  const { userShares, decimals, assetDecimals, totalAssets } = useVault()
  const { totalDeposited, loading } = useUserInvestmentStats(
    address,
    assetDecimals ?? 6
  )

  // Solde mUSDC utilisateur
  const [userBalance, setUserBalance] = useState<bigint | null>(null)

  // Valeur actuelle du portefeuille (estimation basée sur les parts)
  const [portfolioValue, setPortfolioValue] = useState<string>('0')

  // Valeur du jeton unique
  const [tokenValue, setTokenValue] = useState<string>('0')

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setUserBalance(null)
        return
      }
      try {
        const abi = (mockUSDCAbiJson.abi ?? mockUSDCAbiJson) as Abi
        const balance = await readContract(wagmiConfig, {
          abi,
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
  }, [address])

  // Calcul de la valeur du portefeuille et du jeton unique
  useEffect(() => {
    if (userShares && totalAssets && decimals && assetDecimals) {
      try {
        // Valeur du portefeuille = parts * (totalAssets / totalSupply)
        const totalSupply = userShares // Simplification pour l'exemple
        const portfolioValueBigInt = (userShares * totalAssets) / totalSupply
        const portfolioValueFormatted = formatUnits(
          portfolioValueBigInt,
          assetDecimals
        )
        setPortfolioValue(portfolioValueFormatted)

        // Valeur du jeton unique = totalAssets / totalSupply
        const tokenValueBigInt = totalAssets / totalSupply
        const tokenValueFormatted = formatUnits(tokenValueBigInt, assetDecimals)
        setTokenValue(tokenValueFormatted)
      } catch (error) {
        console.error('Erreur calcul valeur:', error)
        setPortfolioValue('0')
        setTokenValue('0')
      }
    }
  }, [userShares, totalAssets, decimals, assetDecimals])

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

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
                  : `${formatCurrency(formatUnits(userBalance, 6))} USDC`}
              </p>
            </div>
          </div>
        </div>

        {/* Montant total investi */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Montant total investi
              </p>
              <p className="text-lg font-bold text-green-900">
                {loading
                  ? '...'
                  : `${formatCurrency(totalDeposited / 1e6)} USDC`}
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
                  : `${formatCurrency(portfolioValue)} USDC`}
              </p>
            </div>
          </div>
        </div>

        {/* Valeur du jeton unique */}
        <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Votre jeton unique vaut actuellement
            </p>
            <p className="text-2xl font-bold text-amber-900">
              {tokenValue === '0'
                ? '...'
                : `${formatCurrency(tokenValue)} USDC`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default VaultSummary
