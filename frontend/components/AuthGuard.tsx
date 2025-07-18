'use client'

import { useUser } from '@/context/UserContext'
import { useAccount } from 'wagmi'
import AccessDenied from './AccessDenied'

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

  // Vérifier si le profil est complété
  const hasProfile =
    typeof window !== 'undefined' &&
    localStorage.getItem('kinoshi-risk-profile') !== null

  if (loadingRole) {
    return (
      <div className="w-full flex justify-center items-center min-h-[40vh]">
        <span className="text-lg font-bold animate-pulse">Chargement...</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <AccessDenied message="Connecte ton wallet pour accéder à cette page." />
    )
  }

  if (requireAdmin && !isAdmin) {
    return <AccessDenied message="Accès réservé à l'administrateur." />
  }

  if (requireProfile && !hasProfile) {
    return (
      <AccessDenied message="Complète ton profil de risque pour accéder à cette page." />
    )
  }

  return <>{children}</>
}

export default AuthGuard
