import { useVaultUserEvents } from './useVaultUserEvents'
import { useVault } from '@/context/VaultContext'

export function useUserInvestmentStats(userAddress?: string, decimals = 6) {
  const { events, loading, error } = useVaultUserEvents(userAddress)
  const { userShares, totalAssets } = useVault()

  // Montant total investi = somme des dépôts
  const totalDeposited = events
    .filter((e) => e.type === 'deposit')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  // Montant total retiré = somme des retraits
  const totalWithdrawn = events
    .filter((e) => e.type === 'withdraw')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  // Frais de sortie cumulés
  const totalExitFees = events
    .filter((e) => e.type === 'exitFee')
    .reduce((sum, e) => sum + Number(e.fee ?? 0), 0)

  // Valeur actuelle des parts détenues
  const shares = userShares ? Number(userShares) / 10 ** decimals : 0
  const vaultAssets = totalAssets ? Number(totalAssets) / 10 ** decimals : 0
  // Pour un ERC4626, la valeur d'une part peut être calculée plus précisément avec convertToAssets(userShares)

  // Profit = valeur actuelle + total retiré - total investi - frais
  const profit = shares + totalWithdrawn - totalDeposited - totalExitFees

  return {
    totalDeposited,
    totalWithdrawn,
    totalExitFees,
    shares,
    profit,
    loading,
    error,
  }
}
