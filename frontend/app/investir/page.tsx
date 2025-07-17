'use client'

import React from 'react'
import VaultInfo from '@/components/VaultInfo'
import DepositForm from '@/components/DepositForm'
import RedeemForm from '@/components/RedeemForm'
import MintMockUSDC from '@/components/MintMockUSDC'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
} from '@/components/ui'

const InvestirPage = () => {
  return (
    <div className="w-full">
      <div className="flex justify-center items-center min-h-[220px] ">
        <div className="relative px-6 sm:px-10 py-4 sm:py-6 rounded-3xl bg-white/10 border border-[var(--kinoshi-accent)]/40 backdrop-blur-xl shadow-2xl max-w-6xl w-full mx-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-accent)] drop-shadow-lg tracking-tight text-center">
            Investir
          </h1>
          <p className="text-lg font-sans font-medium text-white/90 tracking-wide text-center">
            Effectuez vos investissements et gérez vos retraits en toute
            simplicité.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - VaultInfo (1/3) */}
          <div className="lg:col-span-1">
            <VaultInfo />
            <MintMockUSDC />
          </div>

          {/* Colonne droite - Investir/Retirer (2/3) */}
          <div className="lg:col-span-2">
            <KinoshiCard variant="outlined">
              <KinoshiCardHeader>
                <KinoshiCardTitle>Investir / Retirer</KinoshiCardTitle>
              </KinoshiCardHeader>
              <KinoshiCardContent className="space-y-6">
                <DepositForm />
                <RedeemForm />
              </KinoshiCardContent>
            </KinoshiCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvestirPage
