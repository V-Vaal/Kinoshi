import React, { useState } from 'react'
import { useVault } from '@/context/VaultContext'
import { useUserPortfolio, PortfolioToken } from '@/hooks/useUserPortfolio'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Coins, RefreshCw } from 'lucide-react'

import { formatUSDCValue } from '@/utils/formatting'

// Helper pour formater les valeurs en USDC (remplacé par formatUSDCValue)
const formatValueAsUSDC = formatUSDCValue

const RWABreakdown: React.FC = () => {
  const { userShares, refreshUserData } = useVault()
  const { currentValue, breakdown, warning } = useUserPortfolio()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fonction de refresh manuel
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshUserData()])
      // Déclencher un refresh du portfolio
      window.dispatchEvent(new CustomEvent('portfolio-refresh'))
    } catch {
      // Erreur silencieuse
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isRefreshing) {
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
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
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

  // ✅ Utiliser le portefeuille utilisateur calculé via convertToAssets(userShares)
  const displayBalances = breakdown || []

  // ✅ Calculer la somme des valeurs individuelles pour vérifier la cohérence
  const calculatedTotalValue = displayBalances.reduce(
    (sum, item) => sum + item.currentValue,
    0
  )
  const displayTotalValue = calculatedTotalValue || 0

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
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {userShares && userShares > 0n
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
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning si désynchronisation détectée */}
        {warning && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-yellow-800">{warning}</span>
            </div>
          </div>
        )}

        {/* ✅ Total de la valeur RWA (doit correspondre à convertToAssets(userShares)) */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              Valeur totale des RWA
            </span>
            <span className="text-lg font-bold text-blue-900">
              {formatValueAsUSDC(displayTotalValue)}
            </span>
          </div>
          {/* ✅ Indicateur de cohérence */}
          {Math.abs(displayTotalValue - currentValue) < 0.01 && (
            <div className="text-xs text-green-600 mt-1">
              ✓ Cohérent avec convertToAssets(userShares)
            </div>
          )}
        </div>

        {/* ✅ Détail par token - données réelles on-chain */}
        <div className="space-y-3">
          {displayBalances.map((item: PortfolioToken) => (
            <div key={item.tokenAddress} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="min-w-[70px]">
                    {item.symbol}
                  </Badge>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      {formatValueAsUSDC(item.amountInvested)} investis
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Prix: {formatValueAsUSDC(item.oraclePrice)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatValueAsUSDC(item.currentValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.tokenQuantity.toFixed(6)} {item.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.allocationPercent.toFixed(0)}% stratégie
                  </div>
                </div>
              </div>
              <Progress value={item.allocationPercent} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default RWABreakdown
