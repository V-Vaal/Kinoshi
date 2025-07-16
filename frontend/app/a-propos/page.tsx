'use client'

import React from 'react'

const AProposPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="flex justify-center items-center min-h-[220px] mb-8">
        <div className="relative px-6 sm:px-10 py-10 sm:py-12 rounded-3xl bg-white/10 border border-[var(--kinoshi-accent)]/40 backdrop-blur-xl shadow-2xl max-w-3xl w-full mx-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-accent)] drop-shadow-lg mb-4 tracking-tight text-center">
            À propos de Kinoshi
          </h1>
          <p className="text-lg font-sans font-medium text-white/90 tracking-wide text-center">
            Découvrez notre vision et notre approche de l'investissement
            responsable.
          </p>
        </div>
      </div>

      <div className="bg-[#FAFAF7] rounded-2xl p-6 shadow-lg border border-[var(--kinoshi-gold)]/40">
        <p className="text-base font-sans text-[var(--kinoshi-text)] leading-relaxed">
          Kinoshi est une plateforme d'investissement innovante qui démocratise
          l'accès aux actifs réels (RWA) grâce à la technologie blockchain.
          Notre mission est de rendre l'investissement simple, transparent et
          accessible à tous, tout en privilégiant des actifs durables et
          éthiques.
        </p>
      </div>
    </div>
  )
}

export default AProposPage
