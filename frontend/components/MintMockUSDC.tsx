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
      } catch {
        setUserBalance(null)
      }
    }
    fetchBalance()
  }, [address, loading])

  // ✅ MockUSDC n'a pas de contrôle d'accès, tout utilisateur connecté peut mint
  const hasRiskProfile =
    typeof window !== 'undefined' &&
    localStorage.getItem('kinoshi-risk-profile') !== null
  if (isVisitor || !address) return null

  const handleMint = async () => {
    setLoading(true)
    try {
      const abi = (mockUSDCAbiJson.abi ?? mockUSDCAbiJson) as Abi

      await writeContract(wagmiConfig, {
        abi,
        address: mockTokenAddresses.mUSDC as `0x${string}`,
        functionName: 'mint',
        args: [address, MINT_AMOUNT],
      })

      toast.success('1000 USDC ajoutés à votre portefeuille !')

      // Attendre la confirmation de la transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Rafraîchir les données utilisateur
      await refreshUserData()

      // Dispatcher les événements de refresh
      window.dispatchEvent(new Event('vault-refresh'))
      window.dispatchEvent(new Event('user-data-refresh'))
    } catch (e) {
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
          Solde actuel :{' '}
          {userBalance === null
            ? '...'
            : `${formatUnits(userBalance, 18)} USDC`}
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
            ? "Vous avez déjà assez d'USDC"
            : 'Obtenir 1000 USDC (test)'}
      </KinoshiButton>
    </div>
  )
}

export default MintMockUSDC
