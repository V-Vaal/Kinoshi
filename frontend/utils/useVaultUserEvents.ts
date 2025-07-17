import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!userAddress) return
    if (!publicClient) return

    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      try {
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

        const depositedLogs = depositedEvent
          ? await publicClient.getLogs({
              address: vaultAddress as `0x${string}`,
              event: depositedEvent as any,
              args: { user: userAddress },
              fromBlock: 'earliest',
            })
          : []

        const withdrawLogs = withdrawEvent
          ? await publicClient.getLogs({
              address: vaultAddress as `0x${string}`,
              event: withdrawEvent as any,
              args: { user: userAddress },
              fromBlock: 'earliest',
            })
          : []

        const exitFeeLogs = exitFeeEvent
          ? await publicClient.getLogs({
              address: vaultAddress as `0x${string}`,
              event: exitFeeEvent as any,
              args: { user: userAddress },
              fromBlock: 'earliest',
            })
          : []

        // 4. Récupérer les timestamps des blocs (optionnel mais recommandé)
        const allLogs = [
          ...depositedLogs.map((log) => {
            const logAny = log as any
            const args = logAny.args
              ? (logAny.args as Record<string, unknown>)
              : {}
            return {
              type: 'deposit' as const,
              amount: (args.amount as bigint) ?? 0n,
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
        await Promise.all(
          blockNumbers.map(async (blockNumber) => {
            const block = await publicClient.getBlock({
              blockNumber: BigInt(blockNumber),
            })
            blockTimestamps[Number(blockNumber)] = Number(block?.timestamp ?? 0)
          })
        )

        // Ajouter le timestamp à chaque event
        const eventsWithTimestamps = allLogs.map((log) => ({
          ...log,
          timestamp: blockTimestamps[Number(log.blockNumber)] ?? 0,
        }))

        // Trier par blockNumber croissant
        eventsWithTimestamps.sort(
          (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
        )

        setEvents(eventsWithTimestamps as VaultUserEvent[])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [userAddress, publicClient])

  return { events, loading, error }
}
