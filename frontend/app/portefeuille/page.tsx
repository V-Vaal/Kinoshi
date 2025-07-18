'use client'

import React from 'react'
import AuthGuard from '@/components/AuthGuard'

const PortefeuillePage: React.FC = () => {
  return (
    <AuthGuard requireProfile={true}>
      <div className="w-full">
        <div className="flex justify-center items-center min-h-[180px] mb-8">
          <div className="relative px-6 sm:px-10 py-8 sm:py-10 rounded-3xl bg-white/15 border border-[var(--kinoshi-accent)]/30 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-white drop-shadow-lg mb-4 tracking-tight text-center">
              Votre portefeuille
            </h1>
            <p className="text-lg font-sans font-medium text-white/95 tracking-wide text-center">
              Suivez vos investissements et la performance de vos actifs.
            </p>
          </div>
        </div>

        <div className="bg-[#FAFAF7] rounded-2xl p-6 shadow-lg border border-[var(--kinoshi-gold)]/40">
          <p className="text-base font-sans text-[var(--kinoshi-text)] leading-relaxed">
            Consultez l'état de vos investissements, l'évolution de votre
            portefeuille et les performances de vos actifs. Visualisez la
            répartition de vos placements et suivez les tendances du marché en
            temps réel.
          </p>
        </div>
      </div>
    </AuthGuard>
  )
}

export default PortefeuillePage
