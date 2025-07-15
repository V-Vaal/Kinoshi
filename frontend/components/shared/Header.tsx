import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { useUser } from '@/context/UserContext'

const Header = () => {
  const { isAdmin, isAuthorized, loadingRole } = useUser()

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

  return (
    <header className="w-full flex justify-center mt-4 mb-8">
      <div className="max-w-7xl w-full bg-[#FAFAF7] border border-[var(--kinoshi-accent)]/40 shadow-2xl flex items-center px-8 h-auto rounded-2xl">
        <div className="flex items-center flex-1 min-w-0 ">
          <Image
            src="/assets/kinoshi_logo.png"
            alt="Kinoshi"
            width={150}
            height={150}
            className="h-auto w-auto p-4"
            priority
          />
        </div>
        <nav className="flex-1 flex justify-center space-x-8">
          <span className="text-[var(--kinoshi-accent)] font-serif text-lg font-extrabold hover:text-[var(--kinoshi-primary)] transition-colors duration-200 cursor-pointer">
            Accueil
          </span>
          <span className="text-[var(--kinoshi-text)]/80 font-serif text-lg font-extrabold hover:text-[var(--kinoshi-primary)] transition-colors duration-200 cursor-pointer">
            À propos
          </span>
          <span className="text-[var(--kinoshi-text)]/80 font-serif text-lg font-extrabold hover:text-[var(--kinoshi-primary)] transition-colors duration-200 cursor-pointer">
            Investir
          </span>
        </nav>
        <div className="flex-1 flex justify-end items-center">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="address"
          />
          {badge}
        </div>
      </div>
    </header>
  )
}

export default Header
