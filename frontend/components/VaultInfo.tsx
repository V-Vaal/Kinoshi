import { useAccount } from 'wagmi'
import { useUserInvestmentStats } from '@/utils/useUserInvestmentStats'
import { useVault } from '@/context/VaultContext'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
  KinoshiBadge,
} from '@/components/ui'
import { useEffect, useState } from 'react'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { mockTokenAddresses } from '@/constants'
import mockUSDCAbiJson from '@/abis/MockUSDC.abi.json'
import type { Abi } from 'viem'

// Stub temporaire pour useIsDemo (à remplacer par la vraie logique si besoin)
const useIsDemo = () => true

interface VaultInfoProps {
  className?: string
}

const VaultInfo: React.FC<VaultInfoProps> = ({ className }) => {
  const { address } = useAccount()
  const { userShares, decimals, assetDecimals } = useVault()
  const { totalDeposited, loading } = useUserInvestmentStats(
    address,
    assetDecimals ?? 6
  )
  const isDemo = useIsDemo()

  // Solde mUSDC utilisateur
  const [userBalance, setUserBalance] = useState<bigint | null>(null)
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setUserBalance(null)
        return
      }
      try {
        const abi = (mockUSDCAbiJson.abi ?? mockUSDCAbiJson) as Abi
        const balance = await readContract(wagmiConfig, {
          abi,
          address: mockTokenAddresses.mUSDC as `0x${string}`,
          functionName: 'balanceOf',
          args: [address],
        })
        setUserBalance(balance as bigint)
      } catch {
        setUserBalance(null)
      }
    }
    fetchBalance()
    // Ajout : écoute d'un événement custom pour forcer le refresh
    const handler = () => fetchBalance()
    window.addEventListener('vault-refresh', handler)
    return () => window.removeEventListener('vault-refresh', handler)
  }, [address])

  return (
    <KinoshiCard variant="outlined" className={className}>
      <KinoshiCardHeader className="flex flex-row items-center gap-2">
        <KinoshiCardTitle>Votre investissement</KinoshiCardTitle>
        {isDemo && (
          <KinoshiBadge variant="warning">USDC fictif (démo)</KinoshiBadge>
        )}
      </KinoshiCardHeader>
      <KinoshiCardContent>
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-sans text-[var(--kinoshi-text)]/70 mb-1">
              Montant total investi
            </div>
            <div className="text-2xl font-serif font-extrabold text-[var(--kinoshi-primary)]">
              {loading
                ? '...'
                : `${(Number(totalDeposited) / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} USDC`}
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-[var(--kinoshi-text)]/70 mb-1">
              Vous détenez :
            </div>
            <div className="text-xl font-mono font-semibold text-[var(--kinoshi-text)]">
              {userShares === null || decimals === null ? (
                <div className="animate-pulse h-6 bg-gray-200 rounded w-32" />
              ) : (
                `${(Number(userShares) / 10 ** decimals).toLocaleString('fr-FR', { maximumFractionDigits: 4 })} parts`
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-[var(--kinoshi-text)]/70 mb-1">
              Solde mUSDC (testnet)
            </div>
            <div className="text-xl font-mono font-semibold text-[var(--kinoshi-primary)]">
              {userBalance === null
                ? '...'
                : `${(Number(userBalance) / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} mUSDC`}
            </div>
          </div>
        </div>
      </KinoshiCardContent>
    </KinoshiCard>
  )
}

export default VaultInfo
