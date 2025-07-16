'use client'

import React, { useState, useEffect } from 'react'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
  KinoshiButton,
  Progress,
} from '@/components/ui'

interface Question {
  id: number
  text: string
  options: {
    letter: string
    text: string
    points: number
  }[]
}

interface RiskProfile {
  score: number
  profile: 'Conservateur' | 'Équilibré' | 'Agressif'
  completedAt: string
}

const questions: Question[] = [
  {
    id: 1,
    text: 'Sur quel horizon de temps souhaitez-vous investir votre capital ?',
    options: [
      { letter: 'A', text: 'Moins de 2 ans', points: 1 },
      { letter: 'B', text: 'Entre 2 et 5 ans', points: 2 },
      { letter: 'C', text: 'Plus de 5 ans', points: 3 },
    ],
  },
  {
    id: 2,
    text: 'Que feriez-vous si la valeur de votre investissement baissait de 15 % en quelques semaines ?',
    options: [
      { letter: 'A', text: 'Je vends pour limiter la perte', points: 1 },
      { letter: 'B', text: "Je conserve et j'attends une reprise", points: 2 },
      {
        letter: 'C',
        text: 'Je profite de la baisse pour investir davantage',
        points: 3,
      },
    ],
  },
  {
    id: 3,
    text: 'Quel niveau de fluctuation êtes-vous prêt à accepter sur la valeur de votre portefeuille ?',
    options: [
      {
        letter: 'A',
        text: 'Faible (je veux éviter les variations importantes)',
        points: 1,
      },
      {
        letter: 'B',
        text: 'Modérée (des hausses et baisses raisonnables)',
        points: 2,
      },
      {
        letter: 'C',
        text: "Élevée (j'accepte des mouvements importants pour viser un rendement plus élevé)",
        points: 3,
      },
    ],
  },
  {
    id: 4,
    text: 'Quelle est votre priorité principale ?',
    options: [
      { letter: 'A', text: 'Préserver mon capital', points: 1 },
      {
        letter: 'B',
        text: 'Trouver un équilibre entre risque et rendement',
        points: 2,
      },
      {
        letter: 'C',
        text: 'Maximiser la performance à long terme, même avec un risque élevé',
        points: 3,
      },
    ],
  },
  {
    id: 5,
    text: 'Quelle part de vos revenus/économies cet investissement représente-t-il ?',
    options: [
      {
        letter: 'A',
        text: 'Une part importante, je ne peux pas me permettre de grosses pertes',
        points: 1,
      },
      {
        letter: 'B',
        text: 'Une part significative, mais pas vitale',
        points: 2,
      },
      {
        letter: 'C',
        text: 'Une petite part, que je peux me permettre de perdre sans conséquences majeures',
        points: 3,
      },
    ],
  },
  {
    id: 6,
    text: 'Quelle expérience avez-vous avec les placements risqués (actions, crypto, produits dérivés) ?',
    options: [
      { letter: 'A', text: 'Aucune ou très limitée', points: 1 },
      {
        letter: 'B',
        text: "Moyenne, j'ai déjà investi mais prudemment",
        points: 2,
      },
      {
        letter: 'C',
        text: 'Élevée, je connais bien ces produits et leurs risques',
        points: 3,
      },
    ],
  },
]

const getProfileFromScore = (
  score: number
): 'Conservateur' | 'Équilibré' | 'Agressif' => {
  if (score >= 6 && score <= 9) return 'Conservateur'
  if (score >= 10 && score <= 13) return 'Équilibré'
  return 'Agressif'
}

const getProfileMessage = (profile: string): string => {
  switch (profile) {
    case 'Conservateur':
      return 'Vous privilégiez la sécurité et la stabilité. Nos stratégies conservatrices vous conviendront parfaitement avec des allocations équilibrées vers des actifs stables.'
    case 'Équilibré':
      return 'Vous recherchez un équilibre entre performance et sécurité. Nos stratégies équilibrées vous offriront une diversification optimale pour atteindre vos objectifs.'
    case 'Agressif':
      return "Vous êtes à l'aise avec le risque pour maximiser vos rendements. Nos stratégies dynamiques vous permettront d'exploiter les opportunités de marché."
    default:
      return ''
  }
}

const RiskProfileForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>(
    new Array(questions.length).fill(-1)
  )
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  // Charger le profil depuis localStorage au montage
  useEffect(() => {
    let savedProfile: string | null = null
    if (typeof window !== 'undefined') {
      savedProfile = localStorage.getItem('kinoshi-risk-profile')
    }
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile) as RiskProfile
        setRiskProfile(profile)
        setIsCompleted(true)
      } catch {
        // En cas d'erreur, on supprime le localStorage corrompu
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kinoshi-risk-profile')
        }
      }
    }
  }, [])

  const handleAnswer = (questionIndex: number, points: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = points
    setAnswers(newAnswers)
  }

  const calculateScore = (): number => {
    return answers.reduce((sum, answer) => sum + (answer > 0 ? answer : 0), 0)
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Fin du questionnaire
      const score = calculateScore()
      const profile = getProfileFromScore(score)
      const riskProfileData: RiskProfile = {
        score,
        profile,
        completedAt: new Date().toISOString(),
      }

      setRiskProfile(riskProfileData)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'kinoshi-risk-profile',
          JSON.stringify(riskProfileData)
        )
      }
      setIsCompleted(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setAnswers(new Array(questions.length).fill(-1))
    setRiskProfile(null)
    setIsCompleted(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kinoshi-risk-profile')
    }
  }

  const canProceed = answers[currentStep] > 0
  const progress = ((currentStep + 1) / questions.length) * 100

  if (isCompleted && riskProfile) {
    return (
      <KinoshiCard variant="outlined" className="max-w-2xl mx-auto">
        <KinoshiCardHeader>
          <KinoshiCardTitle>Votre profil d'investisseur</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-serif font-extrabold text-[var(--kinoshi-primary)] mb-2">
              {riskProfile.profile}
            </div>
            <div className="text-lg font-mono font-semibold text-[var(--kinoshi-text)] mb-4">
              Score : {riskProfile.score}/18
            </div>
            <p className="text-[var(--kinoshi-text)]/90 font-sans font-medium leading-relaxed">
              {getProfileMessage(riskProfile.profile)}
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--kinoshi-border)]/30">
            <div className="flex justify-between items-center text-sm text-[var(--kinoshi-text)]/70">
              <span>
                Complété le{' '}
                {new Date(riskProfile.completedAt).toLocaleDateString('fr-FR')}
              </span>
              <KinoshiButton variant="outline" onClick={handleReset} size="sm">
                Recommencer
              </KinoshiButton>
            </div>

            {/* Avertissement changement de stratégie */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <p className="text-sm text-amber-800">
                  Changer de profil n'affecte pas vos investissements actuels.
                  Votre nouvelle stratégie sera appliquée uniquement à vos
                  futurs dépôts.
                </p>
              </div>
            </div>

            {/* Disclaimer profil non-équilibré en démo */}
            {riskProfile.profile !== 'Équilibré' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-sm">ℹ️</span>
                  <p className="text-sm text-blue-800">
                    Pour cette démo, seul le profil <strong>Équilibré</strong>{' '}
                    est disponible. Votre profil a été automatiquement ajusté
                    pour correspondre à la stratégie équilibrée.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 text-center">
              <KinoshiButton
                onClick={() => (window.location.href = '/portefeuille')}
                className="w-full"
              >
                Accéder à mon portefeuille
              </KinoshiButton>
            </div>
          </div>
        </KinoshiCardContent>
      </KinoshiCard>
    )
  }

  const currentQuestion = questions[currentStep]

  return (
    <KinoshiCard variant="outlined" className="max-w-2xl mx-auto">
      <KinoshiCardHeader>
        <KinoshiCardTitle>Profil d'investisseur</KinoshiCardTitle>
        <div className="flex items-center gap-4 mt-2">
          <Progress value={progress} className="flex-1" />
          <span className="text-sm font-mono text-[var(--kinoshi-text)]/70">
            {currentStep + 1}/{questions.length}
          </span>
        </div>
      </KinoshiCardHeader>
      <KinoshiCardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-serif font-extrabold text-[var(--kinoshi-text)] mb-6">
            {currentQuestion.text}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.letter}
                onClick={() => handleAnswer(currentStep, option.points)}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  answers[currentStep] === option.points
                    ? 'border-[var(--kinoshi-primary)] bg-[var(--kinoshi-primary)]/10'
                    : 'border-[var(--kinoshi-border)] hover:border-[var(--kinoshi-primary)]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                      answers[currentStep] === option.points
                        ? 'border-[var(--kinoshi-primary)] bg-[var(--kinoshi-primary)] text-white'
                        : 'border-[var(--kinoshi-border)] text-[var(--kinoshi-text)]/70'
                    }`}
                  >
                    {option.letter}
                  </div>
                  <span className="font-sans font-medium text-[var(--kinoshi-text)]">
                    {option.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <KinoshiButton
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Précédent
          </KinoshiButton>

          <KinoshiButton onClick={handleNext} disabled={!canProceed}>
            {currentStep === questions.length - 1 ? 'Terminer' : 'Suivant'}
          </KinoshiButton>
        </div>
      </KinoshiCardContent>
    </KinoshiCard>
  )
}

export default RiskProfileForm
