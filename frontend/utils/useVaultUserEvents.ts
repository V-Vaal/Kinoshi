import { useEffect, useState, useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { vaultAddress } from '@/constants'
import vaultAbiJson from '@/abis/Vault.abi.json'
import type { Abi } from 'viem'

export type VaultUserEvent = {
  type: 'deposit' | 'withdraw' | 'exitFee'
  amount: bigint
  fee?: bigint
  txHash: string
  blockNumber: number
  timestamp: number
}

export function useVaultUserEvents(userAddress?: string) {
  const publicClient = usePublicClient()
  const [events, setEvents] = useState<VaultUserEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!userAddress || !publicClient) {
      setEvents([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Fetching vault events for user:', userAddress)

      const abi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi
      // On ne garde que les events
      const eventsAbi = abi.filter((e) => e.type === 'event')

      const depositedEvent = eventsAbi.find(
        (e) => (e as any).name === 'Deposited'
      )
      const withdrawEvent = eventsAbi.find(
        (e) => (e as any).name === 'WithdrawExecuted'
      )
      const exitFeeEvent = eventsAbi.find(
        (e) => (e as any).name === 'ExitFeeApplied'
      )

      console.log('📊 Found events:', {
        deposited: !!depositedEvent,
        withdraw: !!withdrawEvent,
        exitFee: !!exitFeeEvent,
      })

      // Récupérer les logs pour chaque type d'event
      const [depositedLogs, withdrawLogs, exitFeeLogs] = await Promise.all([
        depositedEvent
          ? publicClient.getLogs({
              address: vaultAddress as `0x${string}`,
              event: depositedEvent as any,
              args: { user: userAddress as `0x${string}` }, // Correction: user selon l'ABI
              fromBlock: 'earliest',
            })
          : Promise.resolve([]),
        withdrawEvent
          ? publicClient.getLogs({
              address: vaultAddress as `0x${string}`,
              event: withdrawEvent as any,
              args: { user: userAddress as `0x${string}` },
              fromBlock: 'earliest',
            })
          : Promise.resolve([]),
        exitFeeEvent
          ? publicClient.getLogs({
              address: vaultAddress as `0x${string}`,
              event: exitFeeEvent as any,
              args: { user: userAddress as `0x${string}` },
              fromBlock: 'earliest',
            })
          : Promise.resolve([]),
      ])

      console.log('📊 Logs found:', {
        deposited: depositedLogs.length,
        withdraw: withdrawLogs.length,
        exitFee: exitFeeLogs.length,
      })

      // Traiter les logs
      const allLogs = [
        ...depositedLogs.map((log) => {
          const logAny = log as any
          const args = logAny.args
            ? (logAny.args as Record<string, unknown>)
            : {}
          return {
            type: 'deposit' as const,
            amount: (args.amount as bigint) ?? 0n, // Correction: amount selon l'ABI
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          }
        }),
        ...withdrawLogs.map((log) => {
          const logAny = log as any
          const args = logAny.args
            ? (logAny.args as Record<string, unknown>)
            : {}
          return {
            type: 'withdraw' as const,
            amount: (args.assets as bigint) ?? 0n,
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          }
        }),
        ...exitFeeLogs.map((log) => {
          const logAny = log as any
          const args = logAny.args
            ? (logAny.args as Record<string, unknown>)
            : {}
          return {
            type: 'exitFee' as const,
            amount: (args.assets as bigint) ?? 0n,
            fee: (args.fee as bigint) ?? 0n,
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          }
        }),
      ]

      // Récupérer les timestamps des blocs (en batch)
      const blockNumbers = Array.from(
        new Set(allLogs.map((log) => log.blockNumber))
      )
      const blockTimestamps: Record<number, number> = {}

      if (blockNumbers.length > 0) {
        await Promise.all(
          blockNumbers.map(async (blockNumber) => {
            try {
              const block = await publicClient.getBlock({
                blockNumber: BigInt(blockNumber),
              })
              blockTimestamps[Number(blockNumber)] = Number(
                block?.timestamp ?? 0
              )
            } catch (err) {
              console.warn(`Failed to get block ${blockNumber}:`, err)
              blockTimestamps[Number(blockNumber)] = 0
            }
          })
        )
      }

      // Ajouter le timestamp à chaque event
      const eventsWithTimestamps = allLogs.map((log) => ({
        ...log,
        timestamp: blockTimestamps[Number(log.blockNumber)] ?? 0,
      }))

      // Trier par blockNumber croissant
      eventsWithTimestamps.sort(
        (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
      )

      console.log('✅ Events processed:', eventsWithTimestamps.length)
      setEvents(eventsWithTimestamps as VaultUserEvent[])
    } catch (err) {
      console.error('❌ Error fetching vault events:', err)
      setError(err as Error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [userAddress, publicClient])

  // Fetch initial et écouter les événements de refresh
  useEffect(() => {
    fetchEvents()

    const handler = () => {
      console.log('🔄 Refreshing vault events...')
      fetchEvents()
    }

    window.addEventListener('vault-refresh', handler)
    window.addEventListener('user-data-refresh', handler)

    return () => {
      window.removeEventListener('vault-refresh', handler)
      window.removeEventListener('user-data-refresh', handler)
    }
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}
