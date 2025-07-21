import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { useUser } from '@/context/UserContext'
import { usePathname } from 'next/navigation'
import { useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Badge, Button } from '@/components/ui'
import { LogOut, User, Shield, Wallet, Settings } from 'lucide-react'

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
        className={`flex items-center gap-1.5 px-3 py-1.5 ${isAdmin ? 'cursor-pointer hover:bg-primary/90 transition-colors' : ''}`}
        onClick={isAdmin ? () => router.push('/admin') : undefined}
      >
        {isAdmin ? (
          <Shield className="w-3.5 h-3.5" />
        ) : (
          <User className="w-3.5 h-3.5" />
        )}
        <span className="font-medium">{isAdmin ? 'Admin' : 'Utilisateur'}</span>
      </Badge>
    )
  }

  // Déterminer l'onglet actif basé sur le pathname
  const getActiveTab = () => {
    if (pathname === '/a-propos') return 'a-propos'
    if (pathname === '/profil') return 'profil'
    if (pathname === '/portefeuille') return 'portefeuille'
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
      <div className="max-w-7xl w-full bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl shadow-black/10 flex flex-col lg:flex-row items-center px-4 lg:px-6 py-4 rounded-3xl gap-4 lg:gap-6">
        {/* Logo */}
        <div className="flex items-center w-32 lg:w-36">
          <Image
            src="/assets/kinoshi_logo.png"
            alt="Kinoshi"
            width={150}
            height={150}
            className="h-12 w-12 lg:h-16 lg:w-16 object-contain"
            priority
          />
        </div>

        {/* Navigation - Redesign complet */}
        {!isAdmin && (
          <div className="flex-1 flex justify-center">
            <nav className="flex items-center bg-background/60 backdrop-blur-sm border border-border/40 rounded-2xl p-1.5 shadow-lg">
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm lg:text-base transition-all duration-300 ${
                  isActiveTab('portefeuille')
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'hover:bg-accent/60 hover:text-accent-foreground hover:scale-105 text-foreground'
                } ${!hasProfile ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => (window.location.href = '/portefeuille')}
              >
                <Wallet className="w-4 h-4" />
                <span>Portefeuille</span>
              </button>

              <div className="w-px h-6 bg-border/60 mx-1"></div>

              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm lg:text-base transition-all duration-300 ${
                  isActiveTab('a-propos')
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'hover:bg-accent/60 hover:text-accent-foreground hover:scale-105 text-foreground'
                } ${!hasProfile ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => (window.location.href = '/a-propos')}
              >
                <span>À propos</span>
              </button>

              <div className="w-px h-6 bg-border/60 mx-1"></div>

              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm lg:text-base transition-all duration-300 ${
                  isActiveTab('profil')
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'hover:bg-accent/60 hover:text-accent-foreground hover:scale-105 text-foreground'
                }`}
                onClick={() => (window.location.href = '/profil')}
              >
                <Settings className="w-4 h-4" />
                <span>Profil</span>
              </button>
            </nav>
          </div>
        )}

        {/* Navigation admin - Redesign */}
        {isAdmin && pathname === '/admin' && (
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary font-bold text-lg">ADMIN</span>
              </div>
              <div className="h-6 w-px bg-primary/30"></div>
              <span className="text-primary/80 font-medium">
                Panel d'administration
              </span>
            </div>
          </div>
        )}

        {/* Message admin si sur page non-admin */}
        {isAdmin && pathname !== '/admin' && (
          <div className="flex-1 flex justify-center">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center shadow-lg">
              <p className="text-primary/80 font-medium">
                Mode Admin - Accès exclusif au panel d'administration
              </p>
            </div>
          </div>
        )}

        {/* Section droite - Wallet et actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-end">
          {/* ConnectButton avec configuration optimisée */}
          <div className="flex items-center gap-2">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus="avatar"
            />
            {badge}
          </div>

          {/* Bouton déconnexion */}
          {isAuthorized() && (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 px-3 py-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Déconnexion</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
