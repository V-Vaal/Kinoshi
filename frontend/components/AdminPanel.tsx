'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import type { Abi } from 'viem'
import { toast } from 'sonner'
import AdminOraclePriceEditor from './AdminOraclePriceEditor'
import TreasuryManager from './TreasuryManager'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

const AdminPanel: React.FC = () => {
  const { isAdmin } = useUser()
  const { registeredTokens, allocations, fetchTokenData } = useTokenRegistry()
  const [exitFee, setExitFee] = useState('')
  const [mgmtFee, setMgmtFee] = useState('')
  const [currentExitFee, setCurrentExitFee] = useState('')
  const [currentMgmtFee, setCurrentMgmtFee] = useState('')
  const [feeLoading, setFeeLoading] = useState(false)
  const [allocs, setAllocs] = useState<
    { token: string; weight: string; active: boolean }[]
  >([])
  const [allocLoading, setAllocLoading] = useState(false)
  const [allocError, setAllocError] = useState('')

  // Lecture des frais actuels
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const [exit, mgmt] = await Promise.all([
          readContract(wagmiConfig, {
            abi: vaultAbi,
            address: vaultAddress as `0x${string}`,
            functionName: 'exitFeeBps',
          }),
          readContract(wagmiConfig, {
            abi: vaultAbi,
            address: vaultAddress as `0x${string}`,
            functionName: 'managementFeeBps',
          }),
        ])
        setCurrentExitFee((Number(exit) / 100).toString())
        setCurrentMgmtFee((Number(mgmt) / 100).toString())
        setExitFee((Number(exit) / 100).toString())
        setMgmtFee((Number(mgmt) / 100).toString())
      } catch {
        setCurrentExitFee('')
        setCurrentMgmtFee('')
      }
    }
    if (isAdmin) fetchFees()
  }, [isAdmin])

  // Lecture des allocations actuelles
  useEffect(() => {
    if (isAdmin && allocations.length) {
      setAllocs(
        allocations.map((a) => ({
          token: a.token,
          weight: (Number(a.weight) / 1e16).toString(), // %
          active: a.active,
        }))
      )
    }
  }, [isAdmin, allocations])

  // Handler update fees
  const handleUpdateFees = async () => {
    setFeeLoading(true)
    try {
      const exitBps = Math.round(Number(exitFee) * 100)
      const mgmtBps = Math.round(Number(mgmtFee) * 100)
      if (exitBps > 1000 || mgmtBps > 1000) {
        toast.error('Frais trop élevés (max 10%)')
        setFeeLoading(false)
        return
      }
      await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'setFees',
        args: [exitBps, mgmtBps],
      })
      toast.success('Frais mis à jour !')
      setCurrentExitFee(exitFee)
      setCurrentMgmtFee(mgmtFee)
    } catch {
      toast.error('Erreur lors de la mise à jour des frais')
    } finally {
      setFeeLoading(false)
    }
  }

  // Handler update allocations
  const handleUpdateAllocs = async () => {
    setAllocLoading(true)
    setAllocError('')
    try {
      const sum = allocs.reduce((acc, a) => acc + Number(a.weight), 0)
      if (Math.abs(sum - 100) > 0.01) {
        setAllocError('La somme des pondérations doit être 100%')
        setAllocLoading(false)
        return
      }
      const newAllocs = allocs.map((a) => ({
        token: a.token,
        weight: BigInt(Math.round(Number(a.weight) * 1e16)), // % → 1e18
        active: a.active,
      }))
      await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'setAllocations',
        args: [newAllocs],
      })
      toast.success('Stratégie mise à jour !')
      fetchTokenData()
    } catch {
      toast.error('Erreur lors de la mise à jour de la stratégie')
    } finally {
      setAllocLoading(false)
    }
  }

  if (!isAdmin) return <div>Accès réservé à l'admin.</div>

  return (
    <div className="admin-panel" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Admin Panel</h2>
      {/* Section 1 : Frais */}
      <section style={{ marginTop: 32, marginBottom: 48 }}>
        <h3>Gestion des frais</h3>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <label>Frais de sortie (%)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={exitFee}
              onChange={(e) => setExitFee(e.target.value)}
              style={{ width: 80, marginLeft: 8 }}
            />
            <span style={{ marginLeft: 8 }}>(actuel : {currentExitFee}%)</span>
          </div>
          <div>
            <label>Frais de gestion (%)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={mgmtFee}
              onChange={(e) => setMgmtFee(e.target.value)}
              style={{ width: 80, marginLeft: 8 }}
            />
            <span style={{ marginLeft: 8 }}>(actuel : {currentMgmtFee}%)</span>
          </div>
          <button
            type="button"
            onClick={handleUpdateFees}
            disabled={feeLoading}
            style={{ marginLeft: 24 }}
          >
            Mettre à jour les frais
          </button>
        </div>
      </section>
      {/* Section 2 : Pondérations */}
      <section style={{ marginBottom: 48 }}>
        <h3>Gestion de la stratégie (pondérations)</h3>
        <table
          style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Token</th>
              <th style={{ textAlign: 'left' }}>Pondération (%)</th>
              <th style={{ textAlign: 'left' }}>Actif</th>
            </tr>
          </thead>
          <tbody>
            {allocs.map((a, idx) => {
              const t = registeredTokens.find(
                (tk) => tk.tokenAddress.toLowerCase() === a.token.toLowerCase()
              )
              return (
                <tr key={a.token} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{t?.symbol}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={a.weight}
                      onChange={(e) => {
                        const v = e.target.value
                        setAllocs((all) =>
                          all.map((x, i) =>
                            i === idx ? { ...x, weight: v } : x
                          )
                        )
                      }}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={a.active}
                      onChange={(e) =>
                        setAllocs((all) =>
                          all.map((x, i) =>
                            i === idx ? { ...x, active: e.target.checked } : x
                          )
                        )
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 16 }}>
          <b>
            Total :{' '}
            {allocs.reduce((acc, a) => acc + Number(a.weight), 0).toFixed(2)} %
          </b>
          {allocError && (
            <span style={{ color: 'red', marginLeft: 16 }}>{allocError}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleUpdateAllocs}
          disabled={allocLoading}
          style={{ marginTop: 16 }}
        >
          Mettre à jour la stratégie
        </button>
      </section>
      {/* Section des outils de démo */}
      <section style={{ marginTop: 48 }}>
        <AdminOraclePriceEditor />
        <TreasuryManager />
      </section>
    </div>
  )
}

export default AdminPanel
