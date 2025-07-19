import React, { useEffect, useState } from 'react'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { useVault } from '@/context/VaultContext'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import mockPriceFeedAbi from '@/abis/MockPriceFeed.abi.json'
import { vaultAddress, mockOracleAddress } from '@/constants'
import { formatUnits } from 'viem'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Coins } from 'lucide-react'

interface RWABalance {
  symbol: string
  tokenAddress: string
  balance: bigint
  decimals: number
  price: bigint
  value: number
  percent: number
}

const RWABreakdown: React.FC = () => {
  const { allocations, registeredTokens } = useTokenRegistry()
  const { totalAssets } = useVault()
  const [rwaBalances, setRwaBalances] = useState<RWABalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalValue, setTotalValue] = useState<number>(0)

  useEffect(() => {
    const fetchRWABalances = async () => {
      if (!allocations.length || !registeredTokens.length || !totalAssets) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Récupérer les balances et prix pour chaque token RWA actif
        const balancePromises = allocations
          .filter((a) => a.active)
          .map(async (allocation) => {
            const tokenInfo = registeredTokens.find(
              (t) =>
                t.tokenAddress.toLowerCase() === allocation.token.toLowerCase()
            )
            if (!tokenInfo) return null

            // Récupérer la balance du token dans le Vault
            const balance = (await readContract(wagmiConfig, {
              abi: [
                {
                  inputs: [{ name: 'account', type: 'address' }],
                  name: 'balanceOf',
                  outputs: [{ name: '', type: 'uint256' }],
                  stateMutability: 'view',
                  type: 'function',
                },
              ],
              address: allocation.token as `0x${string}`,
              functionName: 'balanceOf',
              args: [vaultAddress],
            })) as bigint

            // Récupérer le prix via l'oracle
            const [price] = (await readContract(wagmiConfig, {
              abi: mockPriceFeedAbi.abi,
              address: mockOracleAddress as `0x${string}`,
              functionName: 'getPrice',
              args: [allocation.token],
            })) as [bigint, bigint]

            return {
              symbol: tokenInfo.symbol,
              tokenAddress: allocation.token,
              balance,
              decimals: tokenInfo.decimals,
              price,
            }
          })

        const results = (await Promise.all(balancePromises)).filter(
          Boolean
        ) as {
          symbol: string
          tokenAddress: string
          balance: bigint
          decimals: number
          price: bigint
        }[]

        // Calculer les valeurs et pourcentages
        let totalValueSum = 0
        const balancesWithValues = results.map((item) => {
          // Prix en 18 décimales, balance en decimals du token
          // Calcul direct : (balance * price) / 10^18 pour obtenir la valeur en USDC
          const valueInUSDC = (item.balance * item.price) / BigInt(10 ** 18)
          const value = parseFloat(formatUnits(valueInUSDC, 6))
          totalValueSum += value

          return {
            ...item,
            value,
            percent: 0, // Sera calculé après
          }
        })

        // Calculer les pourcentages
        const finalBalances = balancesWithValues.map((item) => ({
          ...item,
          percent: totalValueSum > 0 ? (item.value / totalValueSum) * 100 : 0,
        }))

        setRwaBalances(finalBalances)
        setTotalValue(totalValueSum)
      } catch (error) {
        console.error('Erreur lors du calcul des balances RWA:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRWABalances()

    // Écouter les événements de refresh
    const handler = () => fetchRWABalances()
    window.addEventListener('vault-refresh', handler)
    return () => window.removeEventListener('vault-refresh', handler)
  }, [allocations, registeredTokens, totalAssets])

  // Formatage des quantités avec les bonnes décimales
  const formatQuantity = (balance: bigint, decimals: number) => {
    const quantity = parseFloat(formatUnits(balance, decimals))
    return quantity.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals > 6 ? 4 : 2,
      maximumFractionDigits: decimals > 6 ? 6 : 4,
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Répartition de vos actifs (RWA)
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

  if (rwaBalances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Répartition de vos actifs (RWA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Aucun actif RWA trouvé dans votre portefeuille.
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
              {totalValue
                .toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  style: 'currency',
                  currency: 'USD',
                  currencyDisplay: 'code',
                })
                .replace('USD', 'USDC')}
            </span>
          </div>
        </div>

        {/* Détail par token */}
        <div className="space-y-3">
          {rwaBalances.map((item) => (
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
                    {item.value
                      .toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        style: 'currency',
                        currency: 'USD',
                        currencyDisplay: 'code',
                      })
                      .replace('USD', 'USDC')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.percent.toFixed(2)}%
                  </div>
                </div>
              </div>
              <Progress value={item.percent} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default RWABreakdown
