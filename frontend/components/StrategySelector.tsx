'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Badge } from './ui/badge'

interface StrategySelectorProps {
  selectedStrategy: string
  onStrategyChange: (strategyId: string) => void
}

const strategies = [
  {
    id: 'equilibree',
    name: 'Stratégie Équilibrée',
    description:
      'Allocation équilibrée entre les différents actifs pour un risque modéré',
    allocations: [
      { asset: 'USDC', percentage: 25 },
      { asset: 'Or', percentage: 25 },
      { asset: 'Bitcoin', percentage: 25 },
      { asset: 'Obligations', percentage: 15 },
      { asset: 'Actions', percentage: 10 },
    ],
    riskLevel: 'Modéré',
    expectedReturn: '6-8%',
  },
]

export function StrategySelector({
  selectedStrategy,
  onStrategyChange,
}: StrategySelectorProps) {
  const currentStrategy = strategies.find((s) => s.id === selectedStrategy)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stratégie d'Investissement</CardTitle>
        <CardDescription>
          Sélectionnez votre profil de risque et d'investissement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedStrategy === strategy.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onStrategyChange(strategy.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {strategy.description}
                </p>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline">{strategy.riskLevel}</Badge>
                <Badge variant="secondary">{strategy.expectedReturn}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Allocation :</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {strategy.allocations.map((allocation) => (
                  <div key={allocation.asset} className="flex justify-between">
                    <span>{allocation.asset}</span>
                    <span className="font-medium">
                      {allocation.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {currentStrategy && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Stratégie sélectionnée :</strong> {currentStrategy.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Prix fictifs (démo) - Les allocations réelles peuvent varier
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
