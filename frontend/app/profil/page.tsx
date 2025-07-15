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

  useEffect(() => {
    const savedProfile = localStorage.getItem('kinoshi-risk-profile')
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile) as RiskProfile
        setRiskProfile(profile)
        setShowForm(false)
      } catch {
        // En cas d'erreur, on supprime le localStorage corrompu
        localStorage.removeItem('kinoshi-risk-profile')
        setShowForm(true)
      }
    } else {
      setShowForm(true)
    }
  }, [])

  const handleModifyProfile = () => {
    localStorage.removeItem('kinoshi-risk-profile')
    setRiskProfile(null)
    setShowForm(true)
  }

  // Si on doit afficher le formulaire, on utilise le composant existant
  if (showForm) {
    return <RiskProfileForm />
  }

  // Sinon on affiche le résumé du profil
  return (
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
        </KinoshiCardContent>
      </KinoshiCard>
    </div>
  )
}

export default ProfilePage
