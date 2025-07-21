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
            amount: (args.assets as bigint) ?? 0n, // Correction: assets selon l'ABI
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

      // Récupérer les timestamps pour chaque block
      const blockNumbers = [...new Set(allLogs.map((log) => log.blockNumber))]
      const blocks = await Promise.all(
        blockNumbers.map((blockNumber) =>
          publicClient.getBlock({ blockNumber: BigInt(blockNumber) })
        )
      )

      const blockTimestamps = new Map(
        blocks.map((block) => [Number(block.number), Number(block.timestamp)])
      )

      // Ajouter les timestamps aux events
      const eventsWithTimestamps: VaultUserEvent[] = allLogs.map((log) => ({
        ...log,
        timestamp: blockTimestamps.get(log.blockNumber) ?? 0,
      }))

      // Trier par timestamp décroissant (plus récent en premier)
      eventsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp)

      console.log('✅ Events processed:', eventsWithTimestamps.length)
      setEvents(eventsWithTimestamps)
    } catch (err) {
      console.error('❌ Error fetching vault events:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userAddress, publicClient])

  // Fetch initial events
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Refresh events when user address changes
  useEffect(() => {
    if (userAddress) {
      fetchEvents()
    }
  }, [userAddress, fetchEvents])

  // Écouter les événements de refresh
  useEffect(() => {
    const handler = () => {
      fetchEvents()
    }

    window.addEventListener('vault-refresh', handler)
    return () => window.removeEventListener('vault-refresh', handler)
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  }
}
