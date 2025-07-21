import { useUserHistory } from '@/hooks/useUserHistory'
import { useAccount } from 'wagmi'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDown, ArrowUp, Clock, DollarSign } from 'lucide-react'
import { formatTransactionHash } from '@/utils/formatting'

const Historique: React.FC = () => {
  const { address } = useAccount()
  const { history, loading } = useUserHistory(address, 6)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Historique des transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Chargement de l'historique...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--kinoshi-accent)]" />
            Historique des transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div className="space-y-2">
              <p>Aucune transaction trouvée.</p>
              <p className="text-sm">
                Vos dépôts et retraits apparaîtront ici une fois effectués.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--kinoshi-accent)]" />
          Historique des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item, idx) => {
            // Debug log pour les changements de prix
            if (item.type === 'Changement de prix') {
              console.log('🔍 Historique Item:', {
                type: item.type,
                amount: item.amount,
                details: item.details,
                isPositive: item.isPositive,
                hasPriceChange: item.isPositive !== undefined,
              })
            }

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  item.type === 'Changement de prix' &&
                  item.isPositive !== undefined
                    ? item.isPositive
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.type === 'Dépôt' ? (
                    <ArrowDown className="w-4 h-4 text-green-600" />
                  ) : item.type === 'Retrait' ? (
                    <ArrowUp className="w-4 h-4 text-red-600" />
                  ) : item.type === 'Frais de retrait' ? (
                    <DollarSign className="w-4 h-4 text-orange-600" />
                  ) : item.type === 'Changement de prix' ? (
                    <DollarSign
                      className={`w-4 h-4 ${
                        item.isPositive !== undefined
                          ? item.isPositive
                            ? 'text-green-600'
                            : 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    />
                  ) : (
                    <DollarSign className="w-4 h-4 text-gray-600" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.type === 'Dépôt'
                            ? 'default'
                            : item.type === 'Retrait'
                              ? 'secondary'
                              : item.type === 'Frais de retrait'
                                ? 'outline'
                                : 'outline'
                        }
                      >
                        {item.type}
                      </Badge>
                      <span className="font-semibold">
                        {item.amount.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        USDC
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.date.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {item.details && (
                      <div className="text-xs text-muted-foreground">
                        {item.details}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTransactionHash(item.txHash)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default Historique
