'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface RiskProfileFormProps {
  onComplete: (score: number) => void
}

interface Question {
  id: number
  text: string
  options: {
    value: number
    label: string
  }[]
}

const questions: Question[] = [
  {
    id: 1,
    text: "Quel est votre horizon d'investissement ?",
    options: [
      { value: 1, label: 'Moins de 1 an' },
      { value: 2, label: '1-3 ans' },
      { value: 3, label: '3-5 ans' },
      { value: 4, label: 'Plus de 5 ans' },
    ],
  },
  {
    id: 2,
    text: 'Comment réagiriez-vous si votre portefeuille perdait 20% de sa valeur ?',
    options: [
      { value: 1, label: 'Je vendrais immédiatement' },
      { value: 2, label: 'Je vendrais une partie' },
      { value: 3, label: "J'attendrais que ça remonte" },
      { value: 4, label: "J'achèterais plus" },
    ],
  },
  {
    id: 3,
    text: 'Quel pourcentage de votre épargne investissez-vous ?',
    options: [
      { value: 1, label: 'Moins de 10%' },
      { value: 2, label: '10-25%' },
      { value: 3, label: '25-50%' },
      { value: 4, label: 'Plus de 50%' },
    ],
  },
  {
    id: 4,
    text: 'Quel type de rendement recherchez-vous ?',
    options: [
      { value: 1, label: 'Sécurité avant tout' },
      { value: 2, label: 'Rendement modéré' },
      { value: 3, label: 'Croissance' },
      { value: 4, label: 'Croissance agressive' },
    ],
  },
  {
    id: 5,
    text: 'Avez-vous déjà investi dans des actifs numériques ?',
    options: [
      { value: 1, label: 'Jamais' },
      { value: 2, label: 'Un peu' },
      { value: 3, label: 'Modérément' },
      { value: 4, label: 'Régulièrement' },
    ],
  },
]

export function RiskProfileForm({ onComplete }: RiskProfileFormProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = value
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate final score
      const totalScore = newAnswers.reduce((sum, answer) => sum + answer, 0)
      const averageScore = totalScore / questions.length
      setIsCompleted(true)
      onComplete(averageScore)
    }
  }

  const getRiskProfile = (score: number) => {
    if (score <= 1.5)
      return { level: 'Conservateur', color: 'bg-green-100 text-green-800' }
    if (score <= 2.5)
      return { level: 'Modéré', color: 'bg-yellow-100 text-yellow-800' }
    if (score <= 3.5)
      return { level: 'Équilibré', color: 'bg-orange-100 text-orange-800' }
    return { level: 'Dynamique', color: 'bg-red-100 text-red-800' }
  }

  const getRecommendedStrategy = (score: number) => {
    if (score <= 1.5) return 'Stratégie Conservatrice (à venir)'
    if (score <= 2.5) return 'Stratégie Équilibrée'
    if (score <= 3.5) return 'Stratégie Équilibrée'
    return 'Stratégie Dynamique (à venir)'
  }

  if (isCompleted) {
    const score =
      answers.reduce((sum, answer) => sum + answer, 0) / questions.length
    const riskProfile = getRiskProfile(score)
    const recommendedStrategy = getRecommendedStrategy(score)

    return (
      <Card>
        <CardHeader>
          <CardTitle>Profil de Risque Completé</CardTitle>
          <CardDescription>Voici votre profil d'investisseur</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge className={riskProfile.color}>{riskProfile.level}</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">
              Score de risque : {score.toFixed(1)}/4
            </h4>
            <p className="text-sm text-muted-foreground">
              Stratégie recommandée : {recommendedStrategy}
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Vos réponses :</h4>
            <div className="space-y-2 text-sm">
              {questions.map((question, index) => (
                <div key={question.id} className="flex justify-between">
                  <span className="truncate">{question.text}</span>
                  <span className="font-medium">{answers[index]}/4</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => {
              setIsCompleted(false)
              setCurrentQuestion(0)
              setAnswers([])
            }}
            variant="outline"
            className="w-full"
          >
            Recommencer le questionnaire
          </Button>
        </CardContent>
      </Card>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questionnaire de Profil de Risque</CardTitle>
        <CardDescription>
          Question {currentQuestion + 1} sur {questions.length}
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-medium">{question.text}</h3>

        <div className="space-y-2">
          {question.options.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleAnswer(option.value)}
            >
              <div className="text-left">
                <div className="font-medium">{option.label}</div>
              </div>
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Ce questionnaire nous aide à vous proposer la stratégie la plus
          adaptée à votre profil
        </div>
      </CardContent>
    </Card>
  )
}
