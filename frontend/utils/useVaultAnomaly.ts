import { useCallback, useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import { vaultAddress } from '@/constants'

interface VaultAnomalyData {
  isAnomalous: boolean
  ratio: number
  totalAssets: bigint | null
  totalSupply: bigint | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useVaultAnomaly(): VaultAnomalyData {
  const { isConnected } = useAccount()
  const [data, setData] = useState<VaultAnomalyData>({
    isAnomalous: false,
    ratio: 1,
    totalAssets: null,
    totalSupply: null,
    loading: false,
    error: null,
    refetch: () => {},
  })

  const detectVaultAnomaly = useCallback(async () => {
    if (!isConnected) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: 'Wallet non connecté',
      }))
      return
    }

    setData((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const [totalAssets, totalSupply] = await Promise.all([
        readContract(wagmiConfig, {
          abi: [
            {
              inputs: [],
              name: 'totalAssets',
              outputs: [{ type: 'uint256', name: '' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: vaultAddress as `0x${string}`,
          functionName: 'totalAssets',
        }) as Promise<bigint>,
        readContract(wagmiConfig, {
          abi: [
            {
              inputs: [],
              name: 'totalSupply',
              outputs: [{ type: 'uint256', name: '' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: vaultAddress as `0x${string}`,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
      ])

      // Calculer le ratio assets/shares
      const ratio =
        totalSupply > 0n ? Number(totalAssets) / Number(totalSupply) : 1

      // Seuil d'anomalie : ratio < 95%
      const isAnomalous = ratio < 0.95

      setData({
        isAnomalous,
        ratio,
        totalAssets,
        totalSupply,
        loading: false,
        error: null,
        refetch: detectVaultAnomaly,
      })
    } catch (error) {
      console.error("Erreur lors de la détection d'anomalie du Vault:", error)
      setData((prev) => ({
        ...prev,
        loading: false,
        error: "Impossible de vérifier l'état du Vault",
      }))
    }
  }, [isConnected])

  // Détecter l'anomalie au montage et à la connexion
  useEffect(() => {
    detectVaultAnomaly()
  }, [detectVaultAnomaly])

  // Rafraîchir périodiquement (toutes les 30 secondes)
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(detectVaultAnomaly, 30000)
    return () => clearInterval(interval)
  }, [isConnected, detectVaultAnomaly])

  return {
    ...data,
    refetch: detectVaultAnomaly,
  }
}
