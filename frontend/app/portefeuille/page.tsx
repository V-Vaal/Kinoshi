'use client'

import React from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminRedirect from '@/components/AdminRedirect'

import VaultSummary from '@/components/VaultSummary'
import RWABreakdown from '@/components/RWABreakdown'
import Historique from '@/components/Historique'

import SimpleDepositForm from '@/components/SimpleDepositForm'
import SimpleRedeemForm from '@/components/SimpleRedeemForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowDown, ArrowUp, Wallet } from 'lucide-react'

const PortefeuillePage: React.FC = () => {
  return (
    <AuthGuard requireProfile={true}>
      <AdminRedirect>
        <div className="flex justify-center items-center min-h-[180px] mb-8">
          <div className="relative px-6 sm:px-10 py-8 sm:py-10 rounded-3xl bg-white/15 border border-[var(--kinoshi-accent)]/30 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-white drop-shadow-lg tracking-tight text-center">
              Investir
            </h1>
            <p className="text-lg font-sans font-medium text-white/95 tracking-wide text-center">
              Suivez vos investissements et gérez vos dépôts et retraits en
              toute simplicité.
            </p>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto space-y-8 pb-8">
          {/* Layout 2/3 - 1/3 : RWABreakdown | VaultSummary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche (2/3) - Répartition RWA */}
            <div className="lg:col-span-2 space-y-6">
              <RWABreakdown />
            </div>

            {/* Colonne droite (1/3) - Résumé du portefeuille */}
            <div className="lg:col-span-1 space-y-6">
              <VaultSummary />
            </div>
          </div>

          {/* Actions d'investissement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Actions d'investissement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tabs pour dépôt/retrait */}
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="deposit"
                    className="flex items-center gap-2"
                  >
                    <ArrowDown className="w-4 h-4" />
                    Déposer
                  </TabsTrigger>
                  <TabsTrigger
                    value="withdraw"
                    className="flex items-center gap-2"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Retirer
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="deposit" className="mt-6 space-y-6">
                  {/* Séparateur */}
                  <div className="border-t border-border/50"></div>

                  {/* Formulaire de dépôt */}
                  <SimpleDepositForm />
                </TabsContent>
                <TabsContent value="withdraw" className="mt-6">
                  <SimpleRedeemForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Historique des transactions */}
          <Historique />
        </div>
      </AdminRedirect>
    </AuthGuard>
  )
}

export default PortefeuillePage
