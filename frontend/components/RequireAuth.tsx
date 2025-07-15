import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'

interface RequireAuthProps {
  children: React.ReactNode
  adminOnly?: boolean
  userOnly?: boolean
}

const RequireAuth = ({ children, adminOnly, userOnly }: RequireAuthProps) => {
  const { isAdmin, isUser, isVisitor, loadingRole } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loadingRole && isVisitor) {
      router.replace('/unauthorized')
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
    return null
  }

  if (adminOnly && !isAdmin) {
    return null
  }

  if (userOnly && !isUser) {
    return null
  }

  return <>{children}</>
}

export default RequireAuth
