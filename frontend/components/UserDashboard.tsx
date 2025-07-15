import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useVault } from '@/context/VaultContext';
import { useTokenRegistry } from '@/context/TokenRegistryContext';
import { useAccount, useBalance } from 'wagmi';
import RWABreakdown from './RWABreakdown';
import WithdrawPreview from './WithdrawPreview';
import { Button } from './ui/button';

const UserDashboard: React.FC = () => {
  const { address } = useAccount();
  const { isVisitor } = useUser();
  const { userShares, decimals } = useVault();
  const { registeredTokens } = useTokenRegistry();
  const [showWithdrawPreview, setShowWithdrawPreview] = useState(false);

  // Solde mUSDC du wallet
  const { data: usdcBalance } = useBalance({
    address,
    token: registeredTokens.find(t => t.symbol === 'mUSDC')?.tokenAddress as `0x${string}` | undefined
  });

  // Valeur estimée des parts en USDC
  const [userAssets, setUserAssets] = useState<string>('0');
  useEffect(() => {
    if (userShares && decimals !== null) {
      // On suppose 6 décimales pour l'USDC
      const assets = Number(userShares) / 10 ** decimals;
      setUserAssets(assets.toLocaleString('fr-FR', { maximumFractionDigits: 2 }));
    } else {
      setUserAssets('0');
    }
  }, [userShares, decimals]);

  if (isVisitor) return null;

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
        {/* Bloc 2 : Parts détenues */}
        <div className="dashboard-block">
          <h3>Parts détenues</h3>
          <p>
            {userShares !== null && decimals !== null
              ? `${(Number(userShares) / 10 ** decimals).toLocaleString('fr-FR', { maximumFractionDigits: 4 })} parts`
              : '...'}
          </p>
        </div>
        {/* Bloc 3 : Valeur estimée en USDC */}
        <div className="dashboard-block">
          <h3>Valeur estimée</h3>
          <p>
            {userAssets} USDC
          </p>
        </div>
        {/* Bloc 4 : Répartition RWA */}
        <div className="dashboard-block" style={{ minWidth: 300 }}>
          <h3>Répartition de vos actifs</h3>
          <RWABreakdown />
        </div>
        {/* Bloc 5 : Bouton Déposer */}
        <div className="dashboard-block">
          <Button onClick={() => window.location.href = '/depot'}>Déposer</Button>
        </div>
      </div>
      {/* Optionnel : Preview retrait */}
      <div style={{ marginTop: 32 }}>
        <Button variant="outline" onClick={() => setShowWithdrawPreview(v => !v)}>
          {showWithdrawPreview ? 'Masquer la simulation de retrait' : 'Simuler un retrait'}
        </Button>
        {showWithdrawPreview && <WithdrawPreview />}
      </div>
    </div>
  );
};

export default UserDashboard; 