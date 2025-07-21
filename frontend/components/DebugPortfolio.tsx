'use client'

import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { useUserPortfolio } from '@/hooks/useUserPortfolio'
import { useVault } from '@/context/VaultContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatUnits } from 'viem'
import { fromWei, isRealisticValue } from '@/utils/decimalUtils'

const DebugPortfolio: React.FC = () => {
  const { address } = useAccount()
  const { userShares } = useVault()
  const { amountInvested, currentValue, performance, breakdown, warning } =
    useUserPortfolio()
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null)

  if (!address) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">🔍 Debug Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700">Non connecté</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          🔍 Debug Portfolio
          <Badge variant="outline" className="text-xs">
            PHASE 1 - ERC4626
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Informations de base */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>User Shares:</strong>
            <br />
            {userShares ? formatUnits(userShares, 18) : '...'}
          </div>
          <div>
            <strong>Amount Invested:</strong>
            <br />
            {amountInvested.toFixed(2)} USDC
          </div>
          <div>
            <strong>Current Value:</strong>
            <br />
            {currentValue.toFixed(2)} USDC
          </div>
          <div>
            <strong>Performance:</strong>
            <br />
            {performance.toFixed(2)}%
          </div>
        </div>

        {/* Vérification de cohérence ERC-4626 */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">✅ Vérifications ERC-4626:</h4>
          <ul className="space-y-1 text-xs">
            <li>
              • convertToAssets(userShares) = {currentValue.toFixed(2)} USDC
            </li>
            <li>
              • Somme des valeurs individuelles ={' '}
              {breakdown
                .reduce((sum, item) => sum + item.currentValue, 0)
                .toFixed(2)}{' '}
              USDC
            </li>
            <li>
              • Différence:{' '}
              {Math.abs(
                currentValue -
                  breakdown.reduce((sum, item) => sum + item.currentValue, 0)
              ).toFixed(4)}{' '}
              USDC
            </li>
            <li>
              • Cohérent:{' '}
              {Math.abs(
                currentValue -
                  breakdown.reduce((sum, item) => sum + item.currentValue, 0)
              ) < 0.01
                ? '✅'
                : '❌'}
            </li>
            <li>
              • User Portion:{' '}
              {userShares && totalSupply
                ? ((Number(userShares) / Number(totalSupply)) * 100).toFixed(2)
                : '0'}
              %
            </li>
          </ul>
        </div>

        {/* Warning si désynchronisation */}
        {warning && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-orange-700">⚠️ Warning:</h4>
            <p className="text-orange-600 text-xs">{warning}</p>
          </div>
        )}

        {/* Détail des tokens */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">
            📊 Détail des tokens (basé sur stratégie):
          </h4>
          <div className="space-y-2">
            {breakdown.map((item) => (
              <div
                key={item.tokenAddress}
                className="text-xs bg-white p-2 rounded"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{item.symbol}</span>
                  <span>{item.currentValue.toFixed(2)} USDC</span>
                </div>
                <div className="text-gray-600">
                  Investi: {item.amountInvested.toFixed(2)} USDC (
                  {item.allocationPercent.toFixed(0)}%)
                </div>
                <div className="text-gray-600">
                  Quantité: {item.tokenQuantity.toFixed(6)} | Prix:{' '}
                  {item.oraclePrice.toFixed(2)} USDC
                </div>
                <div className="text-gray-600">
                  Performance: {item.performance.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vérifications de réalisme */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">🎯 Vérifications de réalisme:</h4>
          <ul className="space-y-1 text-xs">
            <li>• Valeur &gt; 0: {currentValue > 0 ? '✅' : '❌'}</li>
            <li>
              • Valeur réaliste: {isRealisticValue(currentValue) ? '✅' : '❌'}{' '}
              ({currentValue.toFixed(0)} USDC)
            </li>
            <li>
              • Performance réaliste:{' '}
              {Math.abs(performance) < 1000 ? '✅' : '❌'} (
              {performance.toFixed(2)}%)
            </li>
            <li>
              • Prix oracle réalistes:{' '}
              {breakdown.every((item) =>
                isRealisticValue(item.oraclePrice, 200000)
              )
                ? '✅'
                : '❌'}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default DebugPortfolio
