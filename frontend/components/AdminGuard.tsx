import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdmin, loadingRole } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loadingRole && !isAdmin) {
      router.replace('/unauthorized')
    }
  }, [isAdmin, loadingRole, router])

  if (loadingRole) {
    return null
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
