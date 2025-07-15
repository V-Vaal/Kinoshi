import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'

const Header = () => {
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
        <div className="flex-1 flex justify-end">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="address"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
