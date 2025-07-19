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
  const { events, loading, error } = useVaultUserEvents(userAddress)

  const history: UserHistoryItem[] = events.map((evt) => {
    let type: UserHistoryItem['type']
    let details = ''
    switch (evt.type) {
      case 'deposit':
        type = 'Dépôt'
        break
      case 'withdraw':
        type = 'Retrait'
        break
      case 'exitFee':
        type = 'Frais de sortie'
        details = `Frais appliqué : ${parseFloat(formatUnits(evt.fee ?? 0n, decimals))} USDC`
        break
      default:
        type = 'Autre'
    }
    return {
      type,
      amount: parseFloat(formatUnits(evt.amount, decimals)),
      date: new Date(evt.timestamp * 1000),
      txHash: evt.txHash,
      details,
    }
  })

  history.sort((a, b) => b.date.getTime() - a.date.getTime())

  return { history, loading, error }
}
