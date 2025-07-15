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

const MintMockUSDC: React.FC = () => {
  const { address, isAdmin, isUser, isVisitor } = useUser()
  const { fetchVaultData } = useVault()
  const [loading, setLoading] = useState(false)
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
  }, [address, loading])

  if (isVisitor || !address || (!isAdmin && !isUser)) return null

  const handleMint = async () => {
    setLoading(true)
    try {
      const abi = (mockUSDCAbiJson.abi ?? mockUSDCAbiJson) as Abi
      await writeContract(wagmiConfig, {
        abi,
        address: mockTokenAddresses.mUSDC as `0x${string}`,
        functionName: 'mint',
        args: [address, 1000_000_000], // 1000e6
      })
      toast.success('1000 mUSDC ajoutés à votre portefeuille !')
      await fetchVaultData()
    } catch (e) {
      toast.error('Erreur lors du mint : ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const hasEnough = userBalance !== null && userBalance >= 10_000_000 // 10e6

  return (
    <div className="flex flex-col items-center my-6">
      <KinoshiButton
        onClick={handleMint}
        disabled={loading || hasEnough}
        variant="primary"
        size="lg"
      >
        {hasEnough
          ? 'Vous avez déjà assez de mUSDC'
          : 'Obtenir 1000 USDC (test)'}
      </KinoshiButton>
    </div>
  )
}

export default MintMockUSDC
