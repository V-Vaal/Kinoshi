import { useVaultUserEvents, VaultUserEvent } from './useVaultUserEvents'
import { formatUnits } from 'viem'

export type UserHistoryItem = {
  type: 'Dépôt' | 'Retrait' | 'Frais de sortie' | 'Autre'
  amount: number
  date: Date
  txHash: string
  details?: string
}

export function useUserHistory(userAddress?: string, decimals = 18) {
  const { events, loading, error, refetch } = useVaultUserEvents(userAddress)

  // Debug: afficher les événements bruts avec tous les détails
  console.log(
    '🔍 Raw Events:',
    events.map((e) => ({
      type: e.type,
      amount: e.amount.toString(),
      amountFormatted: formatUnits(e.amount, 18),
      fee: e.fee?.toString(),
      feeFormatted: e.fee ? formatUnits(e.fee, 18) : '0',
      txHash: e.txHash,
      timestamp: e.timestamp,
      blockNumber: e.blockNumber,
    }))
  )

  const history: UserHistoryItem[] = events.map((evt, index) => {
    let type: UserHistoryItem['type']
    let details = ''
    let amount = 0

    switch (evt.type) {
      case 'deposit':
        type = 'Dépôt'
        amount = parseFloat(formatUnits(evt.amount, 18))
        break
      case 'withdraw':
        type = 'Retrait'
        amount = parseFloat(formatUnits(evt.amount, 18))
        break
      case 'exitFee':
        type = 'Frais de sortie'
        amount = parseFloat(formatUnits(evt.amount, 18))
        details = `Frais appliqué : ${parseFloat(formatUnits(evt.fee ?? 0n, decimals))} USDC`
        break
      default:
        type = 'Autre'
        amount = parseFloat(formatUnits(evt.amount, 18))
    }

    return {
      type,
      amount,
      date: new Date(evt.timestamp * 1000),
      txHash: evt.txHash,
      details,
    }
  })

  // Trier par date décroissante (plus récent en premier)
  history.sort((a, b) => b.date.getTime() - a.date.getTime())

  return {
    history,
    loading,
    error,
    refetchHistory: refetch,
  }
}
