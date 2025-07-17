import React, { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import mockPriceFeedAbi from '@/abis/MockPriceFeed.abi.json'
import { vaultAddress, mockOracleAddress } from '@/constants'
import { toast } from 'sonner'

// Helper pour récupérer l'adresse de l'oracle depuis le Vault
async function getOracleAddress(): Promise<string> {
  const oracle = await readContract(wagmiConfig, {
    abi: [
      {
        inputs: [],
        name: 'oracle',
        outputs: [{ type: 'address', name: '' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    address: vaultAddress as `0x${string}`,
    functionName: 'oracle',
  })
  return oracle as string
}

const AdminOraclePriceEditor: React.FC = () => {
  const { isAdmin } = useUser()
  const { registeredTokens, allocations } = useTokenRegistry()
  const [oracleAddress, setOracleAddress] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Récupérer l'adresse de l'oracle au montage
  useEffect(() => {
    if (!oracleAddress) {
      getOracleAddress().then(setOracleAddress)
    }
  }, [oracleAddress])

  // Récupérer les prix actuels
  useEffect(() => {
    const fetchPrices = async () => {
      const activeTokens = allocations
        .filter((a) => a.active)
        .map((a) => a.token)
      const priceMap: Record<string, string> = {}
      for (const token of activeTokens) {
        try {
          const res = (await readContract(wagmiConfig, {
            abi: mockPriceFeedAbi.abi,
            address: mockOracleAddress as `0x${string}`,
            functionName: 'getPrice',
            args: [token],
          })) as [bigint, number]
          // Prix en USD, 18 décimales
          priceMap[token] = (Number(res[0]) / 1e18).toString()
        } catch {
          priceMap[token] = '0'
        }
      }
      setPrices(priceMap)
      setInputs(priceMap)
    }
    fetchPrices()
  }, [allocations])

  if (!isAdmin) return null

  // Met à jour le prix d'un token
  const handleUpdate = async (token: string) => {
    setLoading((l) => ({ ...l, [token]: true }))
    try {
      const newPrice = BigInt(Math.floor(Number(inputs[token]) * 1e18))
      const txHash = await writeContract(wagmiConfig, {
        abi: mockPriceFeedAbi.abi,
        address: mockOracleAddress as `0x${string}`,
        functionName: 'setPrice',
        args: [token, newPrice, 18],
      })
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
      toast.success('Prix mis à jour !')
      setPrices((p) => ({ ...p, [token]: inputs[token] }))
    } catch {
      toast.error('Erreur lors de la mise à jour du prix')
    } finally {
      setLoading((l) => ({ ...l, [token]: false }))
    }
  }

  // Variation rapide x2 ou /2
  const handleQuickChange = (token: string, factor: number) => {
    setInputs((i) => ({
      ...i,
      [token]: (Number(i[token]) * factor).toString(),
    }))
  }

  // Liste des tokens actifs (hors mUSDC)
  const activeTokens = allocations
    .filter((a) => a.active)
    .map((a) => a.token)
    .filter((token) => {
      const t = registeredTokens.find(
        (tk) => tk.tokenAddress.toLowerCase() === token.toLowerCase()
      )
      return t && t.symbol !== 'mUSDC'
    })

  return (
    <div className="admin-oracle-price-editor" style={{ marginTop: 32 }}>
      <h3>Outils de démo : Simulation de variation de valeur (Oracle)</h3>
      <table
        style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Token</th>
            <th style={{ textAlign: 'left' }}>Prix actuel (USD)</th>
            <th style={{ textAlign: 'left' }}>Nouveau prix</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {activeTokens.map((token) => {
            const t = registeredTokens.find(
              (tk) => tk.tokenAddress.toLowerCase() === token.toLowerCase()
            )
            return (
              <tr key={token} style={{ borderBottom: '1px solid #eee' }}>
                <td>{t?.symbol}</td>
                <td>{prices[token]}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={inputs[token] ?? ''}
                    onChange={(e) =>
                      setInputs((i) => ({ ...i, [token]: e.target.value }))
                    }
                    style={{ width: 100 }}
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleUpdate(token)}
                    disabled={loading[token]}
                    style={{ marginRight: 8 }}
                  >
                    Mettre à jour
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => handleQuickChange(token, 2)}
                    style={{ marginRight: 4 }}
                  >
                    x2
                  </button>
                  <button onClick={() => handleQuickChange(token, 0.5)}>
                    /2
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default AdminOraclePriceEditor
