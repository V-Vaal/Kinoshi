import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { useUser } from '@/context/UserContext'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'

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
      <span
        className={`ml-4 px-3 py-1 rounded-full text-xs font-bold shadow ${
          isAdmin
            ? 'bg-green-200 text-green-900 border border-green-400'
            : 'bg-blue-200 text-blue-900 border border-blue-400'
        }`}
      >
        {isAdmin ? 'Admin' : 'Utilisateur'}
      </span>
    )
  }

  // Déterminer l'onglet actif basé sur le pathname
  const getActiveTab = () => {
    if (pathname === '/a-propos') return 'a-propos'
    if (pathname === '/votre-profil-investisseur') return 'profil'
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
    <header className="w-full flex justify-center mt-4 mb-8">
      <div className="max-w-7xl w-full bg-[#FAFAF7] border border-[var(--kinoshi-accent)]/40 shadow-2xl flex items-center px-6 py-4 rounded-2xl">
        {/* Logo - plus compact */}
        <div className="flex items-center w-32">
          <Image
            src="/assets/kinoshi_logo.png"
            alt="Kinoshi"
            width={150}
            height={150}
            className="h-20 w-20 object-contain"
            priority
          />
        </div>

        {/* Navigation centrée avec plus d'espace */}
        <div className="flex-1 flex justify-center px-8">
          <Tabs value={getActiveTab()} className="w-full max-w-2xl">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-[var(--kinoshi-accent)]/20 border border-[var(--kinoshi-accent)]/30">
              <TabsTrigger
                value="portefeuille"
                data-state={isActiveTab('portefeuille') ? 'active' : 'inactive'}
                className={`font-serif font-extrabold text-base cursor-pointer transition-all duration-200 ${
                  isActiveTab('portefeuille')
                    ? 'bg-[var(--kinoshi-accent)]/60 scale-105 shadow-sm'
                    : 'hover:bg-[var(--kinoshi-accent)]/40 hover:scale-105'
                } ${!hasProfile && !isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => (window.location.href = '/portefeuille')}
              >
                Portefeuille
              </TabsTrigger>
              <TabsTrigger
                value="a-propos"
                data-state={isActiveTab('a-propos') ? 'active' : 'inactive'}
                className={`font-serif font-extrabold text-base cursor-pointer transition-all duration-200 ${
                  isActiveTab('a-propos')
                    ? 'bg-[var(--kinoshi-accent)]/60 scale-105 shadow-sm'
                    : 'hover:bg-[var(--kinoshi-accent)]/40 hover:scale-105'
                } ${!hasProfile && !isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => (window.location.href = '/a-propos')}
              >
                À propos
              </TabsTrigger>
              <TabsTrigger
                value="profil"
                data-state={isActiveTab('profil') ? 'active' : 'inactive'}
                className={`font-serif font-extrabold text-base cursor-pointer transition-all duration-200 ${
                  isActiveTab('profil')
                    ? 'bg-[var(--kinoshi-accent)]/60 scale-105 shadow-sm'
                    : 'hover:bg-[var(--kinoshi-accent)]/40 hover:scale-105'
                }`}
                onClick={() =>
                  (window.location.href = '/votre-profil-investisseur')
                }
              >
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="investir"
                data-state={isActiveTab('investir') ? 'active' : 'inactive'}
                className={`font-serif font-extrabold text-base cursor-pointer transition-all duration-200 ${
                  isActiveTab('investir')
                    ? 'bg-[var(--kinoshi-accent)]/60 scale-105 shadow-sm'
                    : 'hover:bg-[var(--kinoshi-accent)]/40 hover:scale-105'
                } ${!hasProfile && !isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => (window.location.href = '/investir')}
              >
                Investir
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ConnectButton, badge et déconnexion - plus compact */}
        <div className="flex items-center w-40 justify-end gap-2">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="address"
          />
          {badge}
          {isAuthorized() && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 text-xs font-medium text-[var(--kinoshi-text)]/70 hover:text-[var(--kinoshi-text)] bg-[var(--kinoshi-accent)]/20 hover:bg-[var(--kinoshi-accent)]/40 rounded-md transition-colors duration-200"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
