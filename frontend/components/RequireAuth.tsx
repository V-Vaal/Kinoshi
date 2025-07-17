import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'

interface RequireAuthProps {
  children: React.ReactNode
  adminOnly?: boolean
  userOnly?: boolean
}

const RequireAuth = ({ children, adminOnly, userOnly }: RequireAuthProps) => {
  const { isAdmin, isVisitor, loadingRole } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Pour les pages admin, vérifier uniquement si l'utilisateur est admin
    if (adminOnly && !loadingRole && !isAdmin) {
      router.replace('/unauthorized')
      return
    }

    // Pour les pages userOnly, vérifier que l'utilisateur a un profil de risque
    if (userOnly && !loadingRole && isVisitor) {
      router.replace('/unauthorized')
      return
    }

    // Pour les autres pages, ne pas bloquer les utilisateurs connectés
    // isVisitor = non connecté, donc on ne bloque que si vraiment pas connecté
    if (!adminOnly && !userOnly && !loadingRole && isVisitor) {
      router.replace('/unauthorized')
    }
  }, [isVisitor, loadingRole, router, adminOnly, userOnly, isAdmin])

  if (loadingRole) {
    return (
      <div className="w-full flex justify-center items-center min-h-[40vh]">
        <span className="text-lg font-bold animate-pulse">
          Chargement du rôle...
        </span>
      </div>
    )
  }

  // Pour les pages admin, bloquer si pas admin
  if (adminOnly && !isAdmin) {
    return null
  }

  // Pour les pages userOnly, bloquer si pas connecté
  if (userOnly && isVisitor) {
    return null
  }

  // Pour les autres pages, ne pas bloquer les utilisateurs connectés
  if (!adminOnly && !userOnly && isVisitor) {
    return null
  }

  return <>{children}</>
}

export default RequireAuth
