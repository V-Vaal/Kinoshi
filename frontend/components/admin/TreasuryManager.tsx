import React, { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
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

const TreasuryManager: React.FC = () => {
  const { isAdmin, address } = useUser()
  const [treasuryBalance, setTreasuryBalance] = useState<string>('0')
  const [to, setTo] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Récupérer le solde de la trésorerie
  const fetchTreasuryBalance = async () => {
    try {
      const bal = await readContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'treasuryBalance',
      })
      setTreasuryBalance(
        (Number(bal) / 1e6).toLocaleString('fr-FR', {
          maximumFractionDigits: 2,
        })
      )
    } catch {
      setTreasuryBalance('0')
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchTreasuryBalance()
    }
  }, [isAdmin])

  // Préremplir l'adresse avec celle de l'admin connecté
  useEffect(() => {
    if (isAdmin && address) setTo(address)
  }, [isAdmin, address])

  const handleWithdraw = async () => {
    if (!to || !amount || Number(amount) <= 0) return
    setLoading(true)
    try {
      const amountRaw = BigInt(Math.floor(Number(amount) * 1e6))
      const txHash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'withdrawTreasury',
        args: [to, amountRaw],
      })
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
      toast.success(`${amount} USDC transférés vers ${to}`)
      setAmount('')
      await fetchTreasuryBalance()
    } catch {
      toast.error('Erreur lors du transfert')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return null

  const treasuryNum = Number(
    treasuryBalance.replace(/\s/g, '').replace(',', '.')
  )
  const amountNum = Number(amount)
  const canWithdraw = to && amountNum > 0 && amountNum <= treasuryNum

  return (
    <div className="treasury-manager" style={{ marginTop: 32, maxWidth: 400 }}>
      <h3>Gestion de la trésorerie</h3>
      <p>
        Fonds disponibles : <b>{treasuryBalance} USDC</b>
      </p>
      <div style={{ margin: '16px 0' }}>
        <label htmlFor="to">Adresse de retrait :</label>
        <input
          id="to"
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{ width: 320, marginLeft: 8 }}
        />
      </div>
      <div style={{ margin: '16px 0' }}>
        <label htmlFor="amount">Montant à transférer :</label>
        <input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: 120, marginLeft: 8 }}
        />
      </div>
      <button
        type="button"
        onClick={handleWithdraw}
        disabled={!canWithdraw || loading}
        style={{ marginTop: 16 }}
      >
        Transférer
      </button>
    </div>
  )
}

export default TreasuryManager
