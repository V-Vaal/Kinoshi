'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import Dashboard from '@/components/Dashboard'
import DepositForm from '@/components/DepositForm'
import RouteGuard from '@/components/RouteGuard'
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
        className="w-full pt-20 min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/assets/background-kinoshi.jpg')" }}
      >
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full mx-4 p-8 flex flex-col gap-8">
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
    <RouteGuard>
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
    </RouteGuard>
  )
}
