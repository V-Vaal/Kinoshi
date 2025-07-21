'use client'

import { useAccount } from 'wagmi'
import { usePathname } from 'next/navigation'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected } = useAccount()
  const pathname = usePathname()

  // Déterminer le background selon la page
  const isHomePage = pathname === '/'
  const backgroundImage = isHomePage
    ? "url('/assets/background-kinoshi.jpg')"
    : "url('/assets/kinoshi_logo.png')"

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{ backgroundImage }}
    >
      {/* Overlay subtil pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/10"></div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {isConnected && <Header />}
        <main
          className={
            isConnected
              ? 'flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8'
              : 'flex-1 w-full min-h-screen'
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
