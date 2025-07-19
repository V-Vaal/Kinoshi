import React from 'react'
import { useRWA } from '@/context/RWAContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Coins } from 'lucide-react'
import { formatUnits } from 'viem'

const RWABreakdown: React.FC = () => {
  const { rwaBalances, totalValue, isLoading, error } = useRWA()

  // Formatage des quantités avec les bonnes décimales
  const formatQuantity = (balance: bigint, decimals: number) => {
    const quantity = parseFloat(formatUnits(balance, decimals))
    return quantity.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals > 6 ? 4 : 2,
      maximumFractionDigits: decimals > 6 ? 6 : 4,
    })
  }

  // Formatage des valeurs en USDC
  const formatCurrency = (value: number) => {
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

  // Formatage des pourcentages en français
  const formatPercent = (value: number) => {
    return (
      value.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + '%'
    )
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Répartition de vos actifs (RWA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-8">Erreur : {error}</div>
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
              {formatCurrency(totalValue)}
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
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPercent(item.percent)}
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
