import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { useUser } from '@/context/UserContext'
import { usePathname } from 'next/navigation'
import { useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Badge, Button } from '@/components/ui'
import { LogOut, User, Shield } from 'lucide-react'

const Header = () => {
  const { isAdmin, isAuthorized, loadingRole } = useUser()
  const pathname = usePathname()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  // Vérifier si le profil est complété
  const hasProfile =
    typeof window !== 'undefined' &&
    localStorage.getItem('kinoshi-risk-profile') !== null

  let badge = null
  if (!loadingRole && isAuthorized()) {
    badge = (
      <Badge
        variant={isAdmin ? 'default' : 'secondary'}
        className="ml-2 flex items-center gap-1"
      >
        {isAdmin ? (
          <Shield className="w-3 h-3" />
        ) : (
          <User className="w-3 h-3" />
        )}
        {isAdmin ? 'Admin' : 'Utilisateur'}
      </Badge>
    )
  }

  // Déterminer l'onglet actif basé sur le pathname
  const getActiveTab = () => {
    if (pathname === '/a-propos') return 'a-propos'
    if (pathname === '/profil') return 'profil'
    if (pathname === '/portefeuille') return 'portefeuille'
    if (pathname === '/investir') return 'investir'
    return 'portefeuille' // Page par défaut
  }

  // Fonction pour vérifier si un onglet est actif
  const isActiveTab = (tabValue: string) => {
    return getActiveTab() === tabValue
  }

  // Fonction pour gérer la déconnexion
  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }

  return (
    <header className="w-full flex justify-center mt-4 mb-6">
      <div className="max-w-7xl w-full bg-white/95 backdrop-blur-sm border border-[var(--kinoshi-accent)]/30 shadow-xl flex flex-col md:flex-row items-center px-4 md:px-8 py-4 md:py-5 rounded-3xl gap-4 md:gap-0">
        {/* Logo - plus compact */}
        <div className="flex items-center w-32 md:w-36">
          <Image
            src="/assets/kinoshi_logo.png"
            alt="Kinoshi"
            width={150}
            height={150}
            className="h-12 w-12 md:h-16 md:w-16 object-contain"
            priority
          />
        </div>

        {/* Navigation centrée avec plus d'espace */}
        <div className="flex-1 flex justify-center px-4 md:px-16">
          <div className="grid w-full max-w-2xl grid-cols-2 md:grid-cols-4 h-12 md:h-14 bg-gradient-to-r from-[var(--kinoshi-accent)]/10 to-[var(--kinoshi-accent)]/5 border border-[var(--kinoshi-accent)]/20 rounded-xl p-1 md:p-1.5 gap-1">
            <button
              className={`font-serif font-extrabold text-sm md:text-base cursor-pointer transition-all duration-300 rounded-lg ${
                isActiveTab('portefeuille')
                  ? 'bg-[var(--kinoshi-accent)]/80 text-white scale-105 shadow-lg'
                  : 'hover:bg-[var(--kinoshi-accent)]/30 hover:scale-105 text-[var(--kinoshi-text)]'
              } ${!hasProfile && !isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => (window.location.href = '/portefeuille')}
            >
              Portefeuille
            </button>
            <button
              className={`font-serif font-extrabold text-sm md:text-base cursor-pointer transition-all duration-300 rounded-lg ${
                isActiveTab('a-propos')
                  ? 'bg-[var(--kinoshi-accent)]/80 text-white scale-105 shadow-lg'
                  : 'hover:bg-[var(--kinoshi-accent)]/30 hover:scale-105 text-[var(--kinoshi-text)]'
              } ${!hasProfile && !isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => (window.location.href = '/a-propos')}
            >
              À propos
            </button>
            <button
              className={`font-serif font-extrabold text-sm md:text-base cursor-pointer transition-all duration-300 rounded-lg ${
                isActiveTab('profil')
                  ? 'bg-[var(--kinoshi-accent)]/80 text-white scale-105 shadow-lg'
                  : 'hover:bg-[var(--kinoshi-accent)]/30 hover:scale-105 text-[var(--kinoshi-text)]'
              }`}
              onClick={() => (window.location.href = '/profil')}
            >
              Profil
            </button>
            <button
              className={`font-serif font-extrabold text-sm md:text-base cursor-pointer transition-all duration-300 rounded-lg ${
                isActiveTab('investir')
                  ? 'bg-[var(--kinoshi-accent)]/80 text-white scale-105 shadow-lg'
                  : 'hover:bg-[var(--kinoshi-accent)]/30 hover:scale-105 text-[var(--kinoshi-text)]'
              } ${!hasProfile && !isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => (window.location.href = '/investir')}
            >
              Investir
            </button>
          </div>
        </div>

        {/* ConnectButton, badge et déconnexion - plus compact */}
        <div className="flex items-center w-full md:w-52 justify-center md:justify-end gap-2 md:gap-3">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="address"
          />
          {badge}
          {isAuthorized() && (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
