import { useVaultUserEvents, VaultUserEvent } from './useVaultUserEvents'

export type UserHistoryItem = {
  type: 'Dépôt' | 'Retrait' | 'Frais de sortie' | 'Autre'
  amount: number
  date: Date
  txHash: string
  details?: string
}

export function useUserHistory(userAddress?: string, decimals = 6) {
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
        details = `Frais appliqué : ${Number(evt.fee ?? 0) / 10 ** decimals} USDC`
        break
      default:
        type = 'Autre'
    }
    return {
      type,
      amount: Number(evt.amount) / 10 ** decimals,
      date: new Date(evt.timestamp * 1000),
      txHash: evt.txHash,
      details,
    }
  })

  history.sort((a, b) => b.date.getTime() - a.date.getTime())

  return { history, loading, error }
}
