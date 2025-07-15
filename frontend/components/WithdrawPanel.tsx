import React, { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useVault } from '@/context/VaultContext'
import { useAccount, useBalance } from 'wagmi'
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import { toast } from 'sonner'
import type { Abi } from 'viem'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

const WithdrawPanel: React.FC = () => {
  const { isUser, isVisitor } = useUser()
  const { address } = useAccount()
  const { userShares, previewRedeem, fetchVaultData, decimals } = useVault()
  const [exitFeeBps, setExitFeeBps] = useState<number | null>(null)
  const [inputShares, setInputShares] = useState<string>('')
  const [netAmount, setNetAmount] = useState<string>('0')
  const [loading, setLoading] = useState(false)

  // Solde mUSDC du wallet (pour maj après retrait)
  const { refetch: refetchUsdc } = useBalance({
    address,
    token: undefined, // mUSDC = native ? sinon à adapter
  })

  // Récupérer exitFeeBps
  useEffect(() => {
    const fetchExitFee = async () => {
      try {
        const bps = await readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'exitFeeBps',
        })
        setExitFeeBps(Number(bps))
      } catch {
        setExitFeeBps(null)
      }
    }
    fetchExitFee()
  }, [])

  // Met à jour le montant net estimé à retirer
  useEffect(() => {
    const fetchPreview = async () => {
      let shares = userShares
      if (inputShares && !isNaN(Number(inputShares))) {
        try {
          shares = BigInt(
            Math.floor(Number(inputShares) * 10 ** (decimals ?? 18))
          )
        } catch {
          shares = 0n
        }
      }
      if (!shares || shares === 0n) {
        setNetAmount('0')
        return
      }
      try {
        const amount = await previewRedeem(shares)
        setNetAmount(
          (Number(amount) / 10 ** 6).toLocaleString('fr-FR', {
            maximumFractionDigits: 2,
          })
        )
      } catch {
        setNetAmount('0')
      }
    }
    fetchPreview()
  }, [userShares, inputShares, previewRedeem, decimals])

  // Handler retrait
  const handleWithdraw = async () => {
    if (!address || !userShares || userShares === 0n || isVisitor) return
    setLoading(true)
    let shares = userShares
    if (inputShares && !isNaN(Number(inputShares))) {
      try {
        shares = BigInt(
          Math.floor(Number(inputShares) * 10 ** (decimals ?? 18))
        )
      } catch {
        shares = 0n
      }
    }
    try {
      const txHash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'redeem',
        args: [shares, address, address],
      })
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
      toast.success('Retrait effectué !')
      await fetchVaultData()
      await refetchUsdc()
      setInputShares('')
    } catch {
      toast.error('Erreur lors du retrait')
    } finally {
      setLoading(false)
    }
  }

  if (!isUser || isVisitor) return null

  const sharesNum = userShares ? Number(userShares) / 10 ** (decimals ?? 18) : 0
  const inputMax = sharesNum.toString()
  const canWithdraw = sharesNum > 0 && !loading

  return (
    <div className="withdraw-panel" style={{ marginTop: 32, maxWidth: 400 }}>
      <h3>Retrait de parts</h3>
      <p>
        Vous détenez{' '}
        <b>{sharesNum.toLocaleString('fr-FR', { maximumFractionDigits: 4 })}</b>{' '}
        parts.
      </p>
      {exitFeeBps !== null && (
        <p>
          Frais de retrait appliqués :{' '}
          <b>
            {(exitFeeBps / 100).toLocaleString('fr-FR', {
              maximumFractionDigits: 2,
            })}{' '}
            %
          </b>
        </p>
      )}
      <div style={{ margin: '16px 0' }}>
        <label htmlFor="shares">Nombre de parts à retirer :</label>
        <input
          id="shares"
          type="number"
          min="0"
          max={inputMax}
          step="0.0001"
          value={inputShares}
          onChange={(e) => setInputShares(e.target.value)}
          placeholder={inputMax}
          style={{ width: 120, marginLeft: 8 }}
        />
        <button
          type="button"
          style={{ marginLeft: 8 }}
          onClick={() => setInputShares(inputMax)}
        >
          Tout retirer
        </button>
      </div>
      <p>
        Montant net estimé à recevoir : <b>{netAmount} mUSDC</b>
      </p>
      <button
        type="button"
        onClick={handleWithdraw}
        disabled={!canWithdraw || Number(inputShares || 0) === 0}
        style={{ marginTop: 16 }}
      >
        Retirer mes parts
      </button>
    </div>
  )
}

export default WithdrawPanel
