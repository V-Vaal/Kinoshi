'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'

interface AdminRedirectProps {
  children: React.ReactNode
}

const AdminRedirect: React.FC<AdminRedirectProps> = ({ children }) => {
  const { isAdmin, loadingRole } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loadingRole && isAdmin) {
      router.replace('/admin')
    }
  }, [isAdmin, loadingRole, router])

  // Si admin, ne rien afficher (redirection en cours)
  if (isAdmin) {
    return null
  }

  // Sinon, afficher le contenu normal
  return <>{children}</>
}

export default AdminRedirect
