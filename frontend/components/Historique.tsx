import { useUserHistory } from '@/utils/useUserHistory'
import { useAccount } from 'wagmi'

const Historique: React.FC = () => {
  const { address } = useAccount()
  const { history, loading } = useUserHistory(address, 6)

  return (
    <div>
      <h2>Historique de vos opérations</h2>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <ul>
          {history.map((item, idx) => (
            <li key={idx}>
              {item.date.toLocaleString('fr-FR')} — {item.type} :{' '}
              {item.amount.toLocaleString('fr-FR', {
                maximumFractionDigits: 2,
              })}{' '}
              USDC {item.details && <span>({item.details})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Historique
