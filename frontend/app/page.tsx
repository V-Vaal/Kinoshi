'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import Dashboard from '@/components/Dashboard'
import DepositForm from '@/components/DepositForm'

export default function HomePage() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="w-full pt-20">
        <div className="flex justify-center items-center min-h-[220px] mb-8">
          <div className="relative px-6 sm:px-10 py-10 sm:py-12 rounded-3xl bg-white/10 border border-[var(--kinoshi-accent)]/40 backdrop-blur-xl shadow-2xl max-w-3xl w-full mx-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-accent)] drop-shadow-lg mb-4 tracking-tight text-center">
              Bienvenue sur Kinoshi
            </h1>
            <p className="text-base sm:text-lg font-sans font-medium text-white/90 tracking-wide text-center">
              Investissez simplement : des actifs réels et choisis pour un
              placement réfléchi.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-white rounded-2xl p-8 shadow-lg w-64 h-64 flex items-center justify-center mx-auto">
              <Image
                src="/assets/kinoshi_logo.png"
                alt="Kinoshi"
                width={200}
                height={200}
                className="mx-auto"
                priority
              />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-serif font-extrabold text-[var(--kinoshi-accent)]">
                Prêt à investir ?
              </h2>
              <p className="text-lg font-sans font-medium text-white/90 max-w-md mx-auto">
                Connectez votre wallet pour accéder à votre tableau de bord et
                commencer à investir.
              </p>
            </div>
          </div>

          <div className="bg-[#FAFAF7] rounded-2xl p-8 shadow-lg border border-[var(--kinoshi-gold)]/40">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus="address"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-center items-center min-h-[220px] mb-8">
        <div className="relative px-6 sm:px-10 py-10 sm:py-12 rounded-3xl bg-white/10 border border-[var(--kinoshi-accent)]/40 backdrop-blur-xl shadow-2xl max-w-3xl w-full mx-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-accent)] drop-shadow-lg mb-4 tracking-tight text-center">
            Bienvenue sur Kinoshi
          </h1>
          <p className="text-lg font-sans font-medium text-white/90 tracking-wide text-center">
            Investissez simplement : des actifs réels et choisis pour un
            placement réfléchi.
          </p>
        </div>
      </div>

      <Dashboard />

      <div className="mt-8">
        <div className="bg-[#FAFAF7] rounded-2xl p-6 shadow-lg border border-[var(--kinoshi-gold)]/40">
          <h3 className="text-xl font-serif font-extrabold text-[var(--kinoshi-text)] mb-4">
            Effectuer un dépôt
          </h3>
          <DepositForm />
        </div>
      </div>
    </div>
  )
}
