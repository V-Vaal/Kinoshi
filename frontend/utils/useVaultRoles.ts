import { useCallback, useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import type { Abi } from 'viem'

interface VaultRoles {
  isAdmin: boolean
  isDefaultAdmin: boolean
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useVaultRoles(): VaultRoles {
  const { address, isConnected } = useAccount()
  const [data, setData] = useState<VaultRoles>({
    isAdmin: false,
    isDefaultAdmin: false,
    loading: false,
    error: null,
    refetch: () => {},
  })

  const fetchRoles = useCallback(async () => {
    if (!isConnected || !address) {
      setData((prev) => ({
        ...prev,
        isAdmin: false,
        isDefaultAdmin: false,
        loading: false,
        error: null,
      }))
      return
    }

    setData((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const abi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

      // Récupérer les rôles
      const [adminRole, defaultAdminRole] = await Promise.all([
        readContract(wagmiConfig, {
          abi,
          address: vaultAddress as `0x${string}`,
          functionName: 'ADMIN_ROLE',
        }),
        readContract(wagmiConfig, {
          abi,
          address: vaultAddress as `0x${string}`,
          functionName: 'DEFAULT_ADMIN_ROLE',
        }),
      ])

      // Vérifier les permissions
      const [hasAdminRole, hasDefaultAdminRole] = await Promise.all([
        readContract(wagmiConfig, {
          abi,
          address: vaultAddress as `0x${string}`,
          functionName: 'hasRole',
          args: [adminRole, address],
        }),
        readContract(wagmiConfig, {
          abi,
          address: vaultAddress as `0x${string}`,
          functionName: 'hasRole',
          args: [defaultAdminRole, address],
        }),
      ])

      setData({
        isAdmin: Boolean(hasAdminRole),
        isDefaultAdmin: Boolean(hasDefaultAdminRole),
        loading: false,
        error: null,
        refetch: fetchRoles,
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error)
      setData((prev) => ({
        ...prev,
        isAdmin: false,
        isDefaultAdmin: false,
        loading: false,
        error: 'Impossible de récupérer les rôles',
      }))
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchRoles()
  }, [address, isConnected])

  return {
    ...data,
    refetch: fetchRoles,
  }
}
