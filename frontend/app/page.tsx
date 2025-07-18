'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import Dashboard from '@/components/Dashboard'
import AuthGuard from '@/components/AuthGuard'
import { useUser } from '@/context/UserContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { isConnected } = useAccount()
  const { isAdmin, loadingRole } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loadingRole && isAdmin) {
      router.replace('/admin')
    }
  }, [isAdmin, loadingRole, router])

  if (!isConnected) {
    return (
      <div
        className="w-full min-h-screen bg-cover bg-center flex items-center justify-center relative"
        style={{ backgroundImage: "url('/assets/background-kinoshi.jpg')" }}
      >
        {/* Overlay pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 bg-white/25 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full mx-4 p-8 flex flex-col gap-8 border border-white/20">
          <div>
            <h1
              className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-surface)] drop-shadow-lg mb-4 tracking-tight text-center"
              style={{ fontWeight: 'lighter', letterSpacing: '0.06em' }}
            >
              Kinoshi
            </h1>
            <p className="text-base sm:text-lg font-sans font-medium text-white/90 tracking-wide text-center">
              Investissez simplement : des actifs réels et choisis pour un
              placement réfléchi.
            </p>
          </div>
          {/* Bloc 2 colonnes */}
          <div className="flex flex-col md:flex-row items-center md:items-stretch md:justify-center gap-8">
            {/* Colonne gauche : image */}
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg w-56 h-56 flex items-center justify-center">
                <Image
                  src="/assets/kinoshi_logo.png"
                  alt="Kinoshi"
                  width={180}
                  height={180}
                  className="mx-auto"
                  priority
                />
              </div>
            </div>
            {/* Colonne droite : texte + bouton */}
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-6">
              <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-[var(--kinoshi-surface)]">
                Prêt à investir ?
              </h2>
              <p className="text-lg font-sans font-medium text-white/90 max-w-md">
                Connectez votre wallet pour accéder à votre tableau de bord et
                commencer à investir.
              </p>
              <div>
                <ConnectButton
                  chainStatus="icon"
                  showBalance={false}
                  accountStatus="address"
                  label="Connecter le portefeuille"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="w-full">
        <div className="flex justify-center items-center min-h-[180px] mb-8">
          <div className="relative px-6 sm:px-10 py-8 sm:py-10 rounded-3xl bg-white/15 border border-[var(--kinoshi-accent)]/30 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-white drop-shadow-lg mb-4 tracking-tight text-center">
              Bienvenue sur Kinoshi
            </h1>
            <p className="text-lg font-sans font-medium text-white/95 tracking-wide text-center">
              Investissez simplement : des actifs réels et choisis pour un
              placement réfléchi.
            </p>
          </div>
        </div>

        <Dashboard />
      </div>
    </AuthGuard>
  )
}
