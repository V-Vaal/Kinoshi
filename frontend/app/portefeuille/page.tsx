'use client'

import React from 'react'
import AuthGuard from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VaultSummary from '@/components/VaultSummary'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PieChart } from 'lucide-react'
import { useEffect, useState } from 'react'

const PortefeuillePage: React.FC = () => {
  const { allocations, registeredTokens, isLoading } = useTokenRegistry()
  const [totalWeight, setTotalWeight] = useState(0n)

  useEffect(() => {
    if (allocations.length > 0) {
      setTotalWeight(allocations.reduce((acc, a) => acc + a.weight, 0n))
    }
  }, [allocations])

  return (
    <AuthGuard requireProfile={true}>
      <div className="w-full max-w-4xl mx-auto space-y-8 pb-8">
        {/* Synthèse portefeuille */}
        <VaultSummary />

        {/* Répartition RWA dynamique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[var(--kinoshi-accent)]" />
              Répartition de vos actifs (RWA)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground">
                Chargement des allocations...
              </div>
            ) : allocations.length === 0 ? (
              <div className="text-center text-muted-foreground">
                Aucune allocation trouvée.
              </div>
            ) : (
              <div className="space-y-3">
                {allocations
                  .filter((a) => a.active)
                  .map((a) => {
                    const token = registeredTokens.find(
                      (t) => t.tokenAddress === a.token
                    )
                    const percent =
                      totalWeight > 0n
                        ? Number((a.weight * 10000n) / totalWeight) / 100
                        : 0
                    return (
                      <div key={a.token} className="flex items-center gap-3">
                        <Badge variant="secondary" className="min-w-[70px]">
                          {token?.symbol || a.token.slice(0, 6)}
                        </Badge>
                        <Progress value={percent} className="flex-1 h-2" />
                        <span className="font-mono text-sm tabular-nums w-12 text-right">
                          {percent.toFixed(2)}%
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bouton Investir */}
        <div className="flex justify-end">
          <Button asChild size="lg">
            <Link href="/investir">Investir</Link>
          </Button>
        </div>
      </div>
    </AuthGuard>
  )
}

export default PortefeuillePage
