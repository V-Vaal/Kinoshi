'use client'

import { useAccount } from 'wagmi'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen flex flex-col bg-[#566243]">
      {isConnected && <Header />}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {children}
      </main>
    </div>
  )
}

export default Layout
