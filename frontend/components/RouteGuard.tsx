import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && isConnected) {
      // Vérifier uniquement la présence du profil investisseur
      const profile = localStorage.getItem('kinoshi-risk-profile')
      if (profile === null) {
        router.replace('/votre-profil-investisseur')
        return
      }

      // Si on est sur la page d'accueil et qu'on a un profil, rediriger vers le portefeuille
      if (window.location.pathname === '/') {
        router.replace('/portefeuille')
        return
      }
    }
    if (typeof window !== 'undefined') {
      setChecked(true)
    }
  }, [isConnected, router])

  if (!checked) {
    // On attend la vérification
    return null
  }

  return <>{children}</>
}
