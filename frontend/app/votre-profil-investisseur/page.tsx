'use client'

import React from 'react'
import { useUser } from '@/context/UserContext'
import RiskProfileForm from '@/components/RiskProfileForm'

const ProfilInvestisseurPage: React.FC = () => {
  const { isAdmin, loadingRole } = useUser()

  // Vérifier si le profil est complété
  const hasProfile =
    typeof window !== 'undefined' &&
    localStorage.getItem('kinoshi-risk-profile') !== null

  // Si c'est un admin, afficher un message approprié
  if (!loadingRole && isAdmin) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center min-h-[220px] mb-8">
          <div className="relative px-6 sm:px-10 py-10 sm:py-12 rounded-3xl bg-white/10 border border-[var(--kinoshi-accent)]/40 backdrop-blur-xl shadow-2xl max-w-3xl w-full mx-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-accent)] drop-shadow-lg mb-4 tracking-tight text-center">
              Profil investisseur
            </h1>
            <p className="text-lg font-sans font-medium text-white/90 tracking-wide text-center">
              Cette page est réservée aux utilisateurs investisseurs.
            </p>
          </div>
        </div>

        <div className="bg-[#FAFAF7] rounded-2xl p-6 shadow-lg border border-[var(--kinoshi-gold)]/40">
          <p className="text-base font-sans text-[var(--kinoshi-text)] leading-relaxed text-center">
            En tant qu'administrateur, vous avez accès au panneau
            d'administration pour gérer les paramètres du vault.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-center items-center min-h-[220px] mb-8">
        <div className="relative px-6 sm:px-10 py-10 sm:py-12 rounded-3xl bg-white/10 border border-[var(--kinoshi-accent)]/40 backdrop-blur-xl shadow-2xl max-w-3xl w-full mx-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-accent)] drop-shadow-lg mb-4 tracking-tight text-center">
            Votre profil investisseur
          </h1>
          <p className="text-lg font-sans font-medium text-white/90 tracking-wide text-center">
            Définissez votre profil de risque pour des recommandations
            personnalisées.
          </p>
        </div>
      </div>

      <div className="bg-[#FAFAF7] rounded-2xl p-6 shadow-lg border border-[var(--kinoshi-gold)]/40">
        {/* Message d'accès restreint - affiché seulement si pas de profil */}
        {!hasProfile && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <p className="text-sm text-blue-800">
                Pour accéder à votre portefeuille, veuillez d'abord compléter
                votre profil investisseur.
              </p>
            </div>
          </div>
        )}

        <RiskProfileForm />
      </div>
    </div>
  )
}

export default ProfilInvestisseurPage
