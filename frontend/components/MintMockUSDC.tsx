'use client'
import React, { useState, useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import { useVault } from '@/context/VaultContext'
import { mockTokenAddresses } from '@/constants'
import { KinoshiButton } from '@/components/ui'
import { toast } from 'sonner'
import { writeContract, readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import mockUSDCAbiJson from '@/abis/MockUSDC.abi.json'
import type { Abi } from 'viem'
import { formatUnits } from 'viem'

const MintMockUSDC: React.FC = () => {
  const { address, isAdmin, isVisitor } = useUser()
  const { refreshUserData } = useVault()
  const [loading, setLoading] = useState(false)
  const [userBalance, setUserBalance] = useState<bigint | null>(null)

  // MINT_AMOUNT en 18 décimales (1000 USDC)
  const MINT_AMOUNT = 1000_000_000_000_000_000_000n // 1000 * 10^18
  const ENOUGH_BALANCE = 10_000_000_000_000_000_000n // 10 * 10^18

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
        console.log('💰 User balance:', formatUnits(balance as bigint, 18))
      } catch (error) {
        console.error('❌ Error fetching balance:', error)
        setUserBalance(null)
      }
    }
    fetchBalance()
  }, [address, loading])

  // Nouvelle logique : afficher si connecté ET (admin OU a un profil de risque)
  const hasRiskProfile =
    typeof window !== 'undefined' &&
    localStorage.getItem('kinoshi-risk-profile') !== null
  if (isVisitor || !address || (!isAdmin && !hasRiskProfile)) return null

  const handleMint = async () => {
    setLoading(true)
    try {
      console.log('🔄 Minting USDC...')
      const abi = (mockUSDCAbiJson.abi ?? mockUSDCAbiJson) as Abi
      
      const hash = await writeContract(wagmiConfig, {
        abi,
        address: mockTokenAddresses.mUSDC as `0x${string}`,
        functionName: 'mint',
        args: [address, MINT_AMOUNT],
      })
      
      console.log('✅ Mint transaction hash:', hash)
      toast.success('1000 USDC ajoutés à votre portefeuille !')
      
      // Attendre la confirmation de la transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Rafraîchir les données utilisateur
      await refreshUserData()
      
      // Dispatcher les événements de refresh
      window.dispatchEvent(new Event('vault-refresh'))
      window.dispatchEvent(new Event('user-data-refresh'))
      
      console.log('✅ Mint completed successfully')
    } catch (e) {
      console.error('❌ Mint error:', e)
      toast.error('Erreur lors du mint : ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const hasEnough = userBalance !== null && userBalance >= ENOUGH_BALANCE

  return (
    <div className="flex flex-col items-center my-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Solde actuel : {userBalance === null ? '...' : `${formatUnits(userBalance, 18)} USDC`}
        </p>
      </div>
      <KinoshiButton
        onClick={handleMint}
        disabled={loading || hasEnough}
        variant="primary"
        size="lg"
      >
        {loading 
          ? 'Mint en cours...' 
          : hasEnough
          ? 'Vous avez déjà assez d\'USDC'
          : 'Obtenir 1000 USDC (test)'}
      </KinoshiButton>
    </div>
  )
}

export default MintMockUSDC
