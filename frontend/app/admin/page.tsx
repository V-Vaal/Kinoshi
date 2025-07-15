'use client'

import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import type { Abi } from 'viem'
import { vaultAddress } from '@/constants'
import AdminPanel from '@/components/AdminPanel'
import TokenManager from '@/components/TokenManager'
import {
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
} from '@/components/ui'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

const AdminPage: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [owner, setOwner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOwner = async () => {
      setLoading(true)
      try {
        const ownerAddr = await readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'owner',
          args: [],
        })
        setOwner((ownerAddr as string).toLowerCase())
      } catch {
        setOwner(null)
      } finally {
        setLoading(false)
      }
    }
    fetchOwner()
  }, [])

  if (loading) {
    return (
      <KinoshiCard variant="outlined" className="max-w-2xl mx-auto mt-12">
        <KinoshiCardHeader>
          <KinoshiCardTitle>Panel administrateur</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent>
          <div className="text-center text-[var(--kinoshi-text)]/70">
            Chargement...
          </div>
        </KinoshiCardContent>
      </KinoshiCard>
    )
  }

  if (!isConnected || !address || !owner || address.toLowerCase() !== owner) {
    return (
      <KinoshiCard variant="outlined" className="max-w-2xl mx-auto mt-12">
        <KinoshiCardHeader>
          <KinoshiCardTitle>Accès interdit</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent>
          <div className="text-center text-[var(--kinoshi-text)]/70">
            Vous n'avez pas accès à cette page.
          </div>
        </KinoshiCardContent>
      </KinoshiCard>
    )
  }

  return (
    <div className="space-y-12 py-8">
      <AdminPanel />
      <TokenManager />
    </div>
  )
}

export default AdminPage
