import { useVaultUserEvents, VaultUserEvent } from './useVaultUserEvents'
import { formatUnits } from 'viem'
import { useOraclePriceEvents } from '@/hooks/useOraclePriceEvents'

export type UserHistoryItem = {
  type:
    | 'Dépôt'
    | 'Retrait'
    | 'Frais de retrait'
    | 'Changement de prix'
    | 'Autre'
  amount: number
  date: Date
  txHash: string
  details?: string
  isPositive?: boolean // true = hausse, false = baisse, undefined = pas de variation
}

export function useUserHistory(userAddress?: string, decimals = 18) {
  const { events, loading, error, refetch } = useVaultUserEvents(userAddress)
  const { priceEvents } = useOraclePriceEvents()

  // Convertir les événements vault en historique
  const vaultHistory: UserHistoryItem[] = events.map((evt, index) => {
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
        type = 'Frais de retrait'
        // Le fee est en wei (18 décimales), le convertir en USDC
        amount = parseFloat(formatUnits(evt.fee ?? 0n, 18))
        details = `Frais appliqués : 0.5%`
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

  // Convertir les événements de prix oracle en historique
  const oracleHistory: UserHistoryItem[] = priceEvents.map((event) => {
    let details = `Prix ${event.symbol} mis à jour : ${event.price.toFixed(2)} USDC`
    let isPositive = undefined

    if (event.priceChange) {
      const { percentageChange, isPositive: positive } = event.priceChange
      const sign = positive ? '+' : ''
      details += ` (${sign}${percentageChange.toFixed(2)}%)`
      isPositive = positive
    }

    return {
      type: 'Changement de prix' as const,
      amount: event.price,
      date: event.date,
      txHash: event.txHash,
      details,
      isPositive,
    }
  })

  // Combiner les deux historiques
  const history = [...vaultHistory, ...oracleHistory]

  // Trier par date décroissante (plus récent en premier)
  history.sort((a, b) => b.date.getTime() - a.date.getTime())

  return {
    history,
    loading,
    error,
    refetchHistory: refetch,
  }
}
