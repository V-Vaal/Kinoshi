import { useUserInvestmentStats } from '@/utils/useUserInvestmentStats'
import { useUserHistory } from '@/utils/useUserHistory'
import { useAccount, useBalance } from 'wagmi'
import { useUser } from '@/context/UserContext'
import { useVault } from '@/context/VaultContext'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import RWABreakdown from './RWABreakdown'
import WithdrawPanel from './WithdrawPanel'
import WithdrawPreview from './WithdrawPreview'

const UserDashboard: React.FC = () => {
  const { address } = useAccount()
  const { isVisitor } = useUser()
  const { userShares, decimals } = useVault()
  const { registeredTokens } = useTokenRegistry()
  const [showWithdrawPreview, setShowWithdrawPreview] = useState(false)

  // Valeurs issues des hooks events-only
  const {
    totalDeposited,
    profit,
    loading: loadingStats,
  } = useUserInvestmentStats(address, 6)
  const { history, loading: loadingHistory } = useUserHistory(address, 6)

  // Solde mUSDC du wallet
  const { data: usdcBalance } = useBalance({
    address,
    token: registeredTokens.find((t) => t.symbol === 'mUSDC')?.tokenAddress as
      | `0x${string}`
      | undefined,
  })

  if (isVisitor) return null

  return (
    <div className="user-dashboard">
      <h2>Tableau de bord</h2>
      <div className="dashboard-blocks">
        {/* Bloc 1 : Solde mUSDC wallet */}
        <div className="dashboard-block">
          <h3>Solde mUSDC</h3>
          <p>
            {usdcBalance
              ? `${Number(usdcBalance.formatted).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} mUSDC`
              : '...'}
          </p>
        </div>
        {/* Bloc 2 : Montant investi */}
        <div className="dashboard-block">
          <h3>Montant investi</h3>
          <p>
            {loadingStats
              ? '...'
              : `${totalDeposited.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} USDC`}
          </p>
        </div>
        {/* Bloc 3 : Parts détenues */}
        <div className="dashboard-block">
          <h3>Parts détenues</h3>
          <p>
            {userShares !== null && decimals !== null
              ? `${(Number(userShares) / 10 ** decimals).toLocaleString('fr-FR', { maximumFractionDigits: 4 })} parts`
              : '...'}
          </p>
        </div>
        {/* Bloc 4 : Profit */}
        <div className="dashboard-block">
          <h3>Profit / Perte</h3>
          <p>
            {loadingStats
              ? '...'
              : `${profit.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} USDC`}
          </p>
        </div>
        {/* Bloc 5 : Répartition RWA */}
        <div className="dashboard-block" style={{ minWidth: 300 }}>
          <h3>Répartition de vos actifs</h3>
          <RWABreakdown />
        </div>
        {/* Bloc 6 : Retrait */}
        <div className="dashboard-block">
          <WithdrawPanel />
        </div>
        {/* Bloc 7 : Bouton Déposer */}
        <div className="dashboard-block">
          <Button onClick={() => (window.location.href = '/depot')}>
            Déposer
          </Button>
        </div>
      </div>
      {/* Optionnel : Preview retrait */}
      <div style={{ marginTop: 32 }}>
        <Button
          variant="outline"
          onClick={() => setShowWithdrawPreview((v) => !v)}
        >
          {showWithdrawPreview
            ? 'Masquer la simulation de retrait'
            : 'Simuler un retrait'}
        </Button>
        {showWithdrawPreview && <WithdrawPreview />}
      </div>
      {/* Historique des opérations */}
      <div style={{ marginTop: 32 }}>
        <h3>Historique de vos opérations</h3>
        {loadingHistory ? (
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
    </div>
  )
}

export default UserDashboard
