'use client'

import React from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminRedirect from '@/components/AdminRedirect'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VaultSummary from '@/components/VaultSummary'
import RWABreakdown from '@/components/RWABreakdown'
import Historique from '@/components/Historique'
import DebugPortfolio from '@/components/DebugPortfolio'

const PortefeuillePage: React.FC = () => {
  return (
    <AuthGuard requireProfile={true}>
      <AdminRedirect>
        <div className="w-full max-w-7xl mx-auto space-y-8 pb-8">
          {/* Layout 1/3 - 2/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche (1/3) - Résumé du portefeuille */}
            <div className="lg:col-span-1">
              <VaultSummary />

              {/* Bouton Investir */}
              <div className="mt-6">
                <Button asChild size="lg" className="w-full">
                  <Link href="/investir">Investir</Link>
                </Button>
              </div>
            </div>

            {/* Colonne droite (2/3) - Détails et répartition */}
            <div className="lg:col-span-2 space-y-6">
              {/* Répartition RWA avec vraies balances */}
              <RWABreakdown />

              {/* Historique des transactions */}
              <Historique />
            </div>
          </div>

          {/* 🧪 PHASE 4 - Debug temporaire */}
          <div className="mt-8">
            <DebugPortfolio />
          </div>
        </div>
      </AdminRedirect>
    </AuthGuard>
  )
}

export default PortefeuillePage
