import React, { useEffect, useState } from 'react'
import { useVault } from '@/context/VaultContext'

const WithdrawPreview: React.FC = () => {
  const { userShares, previewRedeem } = useVault()
  const [netAmount, setNetAmount] = useState<string>('0')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      if (!userShares || userShares === 0n) {
        setNetAmount('0')
        return
      }
      setLoading(true)
      try {
        const amount = await previewRedeem(userShares)
        setNetAmount(
          (Number(amount) / 10 ** 6).toLocaleString('fr-FR', {
            maximumFractionDigits: 2,
          })
        )
      } catch {
        setNetAmount('Erreur')
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [userShares, previewRedeem])

  if (loading) return <div>Calcul en cours...</div>
  if (netAmount === 'Erreur') return <div>Erreur lors de la simulation.</div>

  return (
    <div className="withdraw-preview">
      <p>Montant net estimé si vous retirez toutes vos parts :</p>
      <p style={{ fontWeight: 'bold', fontSize: 18 }}>{netAmount} USDC</p>
      <small>(Frais de sortie déjà déduits)</small>
    </div>
  )
}

export default WithdrawPreview
