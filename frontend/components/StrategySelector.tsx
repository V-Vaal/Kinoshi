'use client'
import React, { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Tooltip } from 'react-tooltip'

const STRATEGIES = [
  {
    key: 'defensif',
    label: 'Défensif',
    allocations: [
      { asset: "Obligations d'État", percent: 60 },
      { asset: 'Or (mPAXG)', percent: 30 },
      { asset: 'Cash (stables)', percent: 10 },
    ],
    color: 'bg-blue-100 border-blue-300',
    text: 'text-blue-900',
    badge: 'bg-blue-200 text-blue-900 border border-blue-400',
    disabled: true,
  },
  {
    key: 'equilibree',
    label: 'Équilibrée',
    allocations: [
      { asset: 'mUSDS', percent: 35 },
      { asset: 'mBcSPX', percent: 30 },
      { asset: 'mPAXG', percent: 20 },
      { asset: 'mBTC', percent: 15 },
    ],
    color: 'bg-green-100 border-green-300',
    text: 'text-green-900',
    badge: 'bg-green-200 text-green-900 border border-green-400',
    disabled: false,
  },
  {
    key: 'agressif',
    label: 'Agressif',
    allocations: [
      { asset: 'mBTC', percent: 50 },
      { asset: 'Actions US', percent: 30 },
      { asset: 'Stables', percent: 20 },
    ],
    color: 'bg-red-100 border-red-300',
    text: 'text-red-900',
    badge: 'bg-red-200 text-red-900 border border-red-400',
    disabled: true,
  },
]

const getProfile = (): string | null => {
  if (typeof window === 'undefined') return null
  let saved: string | null = null
  if (typeof window !== 'undefined') {
    saved = localStorage.getItem('kinoshi-risk-profile')
  }
  if (!saved) return null
  try {
    const parsed = JSON.parse(saved)
    return parsed.profile || null
  } catch {
    return null
  }
}

const StrategySelector: React.FC = () => {
  const [profile, setProfile] = useState<string | null>(null)

  useEffect(() => {
    setProfile(getProfile())
  }, [])

  const recommendedKey = profile
    ? profile.toLowerCase() === 'conservateur'
      ? 'defensif'
      : profile.toLowerCase() === 'agressif'
        ? 'agressif'
        : 'equilibree'
    : null

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="mb-6 text-center">
        <div className="text-lg font-semibold mb-2">
          Selon votre profil de risque, la stratégie recommandée est :
          <span className="ml-2 font-bold">
            {profile ? profile : 'Non défini'}
          </span>
        </div>
        <div className="text-sm text-[var(--kinoshi-text)]/80">
          Pour la démonstration, seule la stratégie{' '}
          <span className="font-bold">Équilibrée</span> est disponible.
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        {STRATEGIES.map((strat) => {
          const isActive = strat.key === 'equilibree'
          const isRecommended = strat.key === recommendedKey
          return (
            <div
              key={strat.key}
              className={`relative flex-1 min-w-[220px] max-w-xs ${strat.color} rounded-xl border shadow-md p-5 ${strat.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              data-tooltip-id={
                strat.disabled ? `tooltip-${strat.key}` : undefined
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`font-serif text-xl font-extrabold ${strat.text}`}
                >
                  {strat.label}
                </span>
                {isActive && (
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-bold shadow ${strat.badge}`}
                  >
                    Stratégie active
                  </span>
                )}
                {isRecommended && (
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold shadow bg-sky-200 text-sky-900 border border-sky-400">
                    Stratégie recommandée
                  </span>
                )}
                {strat.disabled && (
                  <Info className="w-4 h-4 text-gray-400 ml-1" />
                )}
              </div>
              <ul className="mt-2 space-y-1">
                {strat.allocations.map((a, i) => (
                  <li
                    key={i}
                    className="flex justify-between text-sm font-mono"
                  >
                    <span>{a.asset}</span>
                    <span>{a.percent}%</span>
                  </li>
                ))}
              </ul>
              {strat.disabled && (
                <Tooltip
                  id={`tooltip-${strat.key}`}
                  place="top"
                  content="Indisponible pour cette version"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StrategySelector
