'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { useUser } from '@/context/UserContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isAdmin, loadingRole } = useUser()
  const { isConnected, address } = useAccount()
  const router = useRouter()

  const hasProfile =
    typeof window !== 'undefined' &&
    address &&
    localStorage.getItem(`kinoshi-risk-profile-${address.toLowerCase()}`) !==
      null

  useEffect(() => {
    if (loadingRole) return

    if (isConnected && address) {
      if (isAdmin) {
        router.replace('/admin')
      } else if (hasProfile) {
        router.replace('/portefeuille')
      } else {
        router.replace('/profil')
      }
    }
  }, [isConnected, isAdmin, hasProfile, loadingRole, router, address])

  // Affichage landing stylée si non connecté
  if (!isConnected) {
    return (
      <div
        className="w-full min-h-screen bg-cover bg-center flex items-center justify-center relative"
        style={{ backgroundImage: "url('/assets/background-kinoshi.jpg')" }}
      >
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
          <div className="flex flex-col md:flex-row items-center md:items-stretch md:justify-center gap-8">
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

  // Si connecté, la redirection automatique s'applique (rien à afficher ici)
  return null
}
