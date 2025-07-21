'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/context/UserContext'

interface AdminRedirectProps {
  children: React.ReactNode
}

const AdminRedirect: React.FC<AdminRedirectProps> = ({ children }) => {
  const { isAdmin, loadingRole } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loadingRole && isAdmin && pathname !== '/admin') {
      router.replace('/admin')
    }
  }, [isAdmin, loadingRole, router, pathname])

  // Si admin et pas sur la page admin, ne rien afficher (redirection en cours)
  if (isAdmin && pathname !== '/admin') {
    return null
  }

  // Sinon, afficher le contenu normal
  return <>{children}</>
}

export default AdminRedirect
