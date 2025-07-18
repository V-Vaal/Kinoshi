'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import { useAccount } from 'wagmi'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireProfile?: boolean
}

const AuthGuard = ({
  children,
  requireAdmin = false,
  requireProfile = false,
}: AuthGuardProps) => {
  const { isAdmin, loadingRole } = useUser()
  const { isConnected } = useAccount()
  const router = useRouter()

  // Vérifier si le profil est complété
  const hasProfile =
    typeof window !== 'undefined' &&
    localStorage.getItem('kinoshi-risk-profile') !== null

  useEffect(() => {
    if (loadingRole) return

    // Si pas connecté, rediriger vers la page d'accueil
    if (!isConnected) {
      router.replace('/')
      return
    }

    // Si admin requis mais pas admin, rediriger vers la page d'accueil
    if (requireAdmin && !isAdmin) {
      router.replace('/')
      return
    }

    // Si profil requis mais pas de profil, rediriger vers /profil
    if (requireProfile && !hasProfile) {
      router.replace('/profil')
      return
    }

    // Si admin connecté, rediriger vers /admin (sauf si déjà sur une page admin)
    if (isAdmin && !requireAdmin && window.location.pathname !== '/admin') {
      router.replace('/admin')
      return
    }

    // Suppression de la redirection automatique vers /portefeuille
    // Cette logique causait des redirections indésirables sur /profil et /investir
    // Les utilisateurs peuvent maintenant naviguer librement entre les pages autorisées
  }, [
    isConnected,
    isAdmin,
    hasProfile,
    loadingRole,
    requireAdmin,
    requireProfile,
    router,
  ])

  // Affichage de chargement
  if (loadingRole) {
    return (
      <div className="w-full flex justify-center items-center min-h-[40vh]">
        <span className="text-lg font-bold animate-pulse">Chargement...</span>
      </div>
    )
  }

  // Blocage si pas connecté
  if (!isConnected) {
    return null
  }

  // Blocage si admin requis mais pas admin
  if (requireAdmin && !isAdmin) {
    return null
  }

  // Blocage si profil requis mais pas de profil
  if (requireProfile && !hasProfile) {
    return null
  }

  return <>{children}</>
}

export default AuthGuard
