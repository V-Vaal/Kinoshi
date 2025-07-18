'use client'

import { useAccount } from 'wagmi'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#566243] via-[#4a5a3a] to-[#3d4a2f]">
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
  )
}

export default Layout
