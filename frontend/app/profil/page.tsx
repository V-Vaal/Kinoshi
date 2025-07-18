'use client'

import React, { useState, useEffect } from 'react'
import RiskProfileForm from '@/components/RiskProfileForm'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
  KinoshiButton,
} from '@/components/ui'
import MintMockUSDC from '@/components/MintMockUSDC'
import StrategySelector from '@/components/StrategySelector'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'

interface RiskProfile {
  score: number
  profile: 'Conservateur' | 'Équilibré' | 'Agressif'
  completedAt: string
}

const getProfileMessage = (profile: string): string => {
  switch (profile) {
    case 'Conservateur':
      return 'Vous privilégiez la sécurité et la stabilité. Nos stratégies conservatrices vous conviendront parfaitement avec des allocations équilibrées vers des actifs stables.'
    case 'Équilibré':
      return 'Vous cherchez un compromis entre performance et sécurité. Nos stratégies équilibrées vous offriront une diversification optimale pour atteindre vos objectifs.'
    case 'Agressif':
      return "Vous êtes à l'aise avec le risque pour maximiser vos rendements. Nos stratégies dynamiques vous permettront d'exploiter les opportunités de marché."
    default:
      return ''
  }
}

const ProfilePage: React.FC = () => {
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { isAdmin, loadingRole } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loadingRole && isAdmin) {
      router.replace('/admin')
    }
  }, [isAdmin, loadingRole, router])

  useEffect(() => {
    let savedProfile: string | null = null
    if (typeof window !== 'undefined') {
      savedProfile = localStorage.getItem('kinoshi-risk-profile')
    }
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile) as RiskProfile
        setRiskProfile(profile)
        setShowForm(false)
      } catch {
        // En cas d'erreur, on supprime le localStorage corrompu
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kinoshi-risk-profile')
        }
        setShowForm(true)
      }
    } else {
      setShowForm(true)
    }
  }, [])

  const handleModifyProfile = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kinoshi-risk-profile')
    }
    setRiskProfile(null)
    setShowForm(true)
  }

  if (loadingRole) {
    return null
  }
  if (isAdmin) {
    return null
  }

  // Si on doit afficher le formulaire, on utilise le composant existant
  if (showForm) {
    return (
      <AuthGuard requireProfile={false}>
        <RiskProfileForm />
      </AuthGuard>
    )
  }

  // Sinon on affiche le résumé du profil
  return (
    <AuthGuard requireProfile={false}>
      <div className="container mx-auto px-4 py-8">
        <KinoshiCard variant="outlined" className="max-w-2xl mx-auto">
          <KinoshiCardHeader>
            <KinoshiCardTitle>Votre profil de risque</KinoshiCardTitle>
          </KinoshiCardHeader>
          <KinoshiCardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-serif font-extrabold text-[var(--kinoshi-primary)] mb-2">
                🎯 Vous êtes un profil {riskProfile?.profile}
              </div>
              <div className="text-lg font-mono font-semibold text-[var(--kinoshi-text)] mb-4">
                Score : {riskProfile?.score}/18
              </div>
              <p className="text-[var(--kinoshi-text)]/90 font-sans font-medium leading-relaxed">
                {riskProfile ? getProfileMessage(riskProfile.profile) : ''}
              </p>

              {/* Texte explicatif ajouté */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  💡 Changer votre profil changera votre stratégie
                  d'investissement.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--kinoshi-border)]/30">
              <div className="flex justify-between items-center text-sm text-[var(--kinoshi-text)]/70">
                <span>
                  Complété le{' '}
                  {riskProfile
                    ? new Date(riskProfile.completedAt).toLocaleDateString(
                        'fr-FR'
                      )
                    : ''}
                </span>
                <KinoshiButton
                  variant="outline"
                  onClick={handleModifyProfile}
                  size="sm"
                >
                  Modifier mon profil
                </KinoshiButton>
              </div>
            </div>
            <MintMockUSDC />
            <StrategySelector />

            {/* Bouton ajouté */}
            <div className="pt-4 border-t border-[var(--kinoshi-border)]/30">
              <KinoshiButton
                onClick={() => (window.location.href = '/portefeuille')}
                className="w-full"
                size="lg"
              >
                Accéder à mon portefeuille Kinoshi
              </KinoshiButton>
            </div>
          </KinoshiCardContent>
        </KinoshiCard>
      </div>
    </AuthGuard>
  )
}

export default ProfilePage
