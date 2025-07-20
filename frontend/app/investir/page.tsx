'use client'

import React from 'react'
import VaultSummary from '@/components/VaultSummary'
import SimpleDepositForm from '@/components/SimpleDepositForm'
import SimpleRedeemForm from '@/components/SimpleRedeemForm'
import MintMockUSDC from '@/components/MintMockUSDC'
import AuthGuard from '@/components/AuthGuard'
import AdminRedirect from '@/components/AdminRedirect'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { ArrowDown, ArrowUp, Wallet } from 'lucide-react'

const InvestirPage = () => {
  return (
    <AuthGuard requireProfile={true}>
      <AdminRedirect>
        <div className="w-full">
          <div className="flex justify-center items-center min-h-[180px] mb-8">
            <div className="relative px-6 sm:px-10 py-8 sm:py-10 rounded-3xl bg-white/15 border border-[var(--kinoshi-accent)]/30 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-white drop-shadow-lg tracking-tight text-center">
                Investir
              </h1>
              <p className="text-lg font-sans font-medium text-white/95 tracking-wide text-center">
                Effectuez vos investissements et gérez vos retraits en toute
                simplicité.
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto w-full mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Colonne gauche - Résumé (1/3) */}
              <div className="lg:col-span-1 space-y-6">
                <VaultSummary />
                <MintMockUSDC />
              </div>

              {/* Colonne droite - Actions (2/3) */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Actions d'investissement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                      <TabsContent value="deposit" className="mt-6">
                        <SimpleDepositForm />
                      </TabsContent>
                      <TabsContent value="withdraw" className="mt-6">
                        <SimpleRedeemForm />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AdminRedirect>
    </AuthGuard>
  )
}

export default InvestirPage
