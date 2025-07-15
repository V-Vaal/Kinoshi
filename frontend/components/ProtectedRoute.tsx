import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isVisitor, loadingRole } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loadingRole && isVisitor) {
      router.replace('/connexion')
    }
  }, [isVisitor, loadingRole, router])

  if (loadingRole) {
    return (
      <div className="w-full flex justify-center items-center min-h-[40vh]">
        <span className="text-lg font-bold animate-pulse">
          Chargement du rôle...
        </span>
      </div>
    )
  }

  if (isVisitor) {
    // On ne rend rien, la redirection est en cours
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
