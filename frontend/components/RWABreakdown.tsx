import React, { useEffect, useState } from 'react'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { useVault } from '@/context/VaultContext'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import mockPriceFeedAbi from '@/abis/MockPriceFeed.abi.json'
import { vaultAddress } from '@/constants'

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

const RWABreakdown: React.FC = () => {
  const { allocations, registeredTokens } = useTokenRegistry()
  const { totalAssets } = useVault()
  const [oracleAddress, setOracleAddress] = useState<string | null>(null)
  const [breakdown, setBreakdown] = useState<
    {
      symbol: string
      percent: number
      value: number
    }[]
  >([])

  useEffect(() => {
    ;(async () => {
      if (!totalAssets || !allocations.length || !registeredTokens.length)
        return
      // Récupérer l'adresse de l'oracle
      if (!oracleAddress) {
        const addr = await getOracleAddress()
        setOracleAddress(addr)
        return
      }
      // Pour chaque allocation active, récupérer le prix et calculer la valeur
      const promises = allocations
        .filter((a) => a.active)
        .map(async (alloc) => {
          const tokenInfo = registeredTokens.find(
            (t) => t.tokenAddress.toLowerCase() === alloc.token.toLowerCase()
          )
          if (!tokenInfo) return null
          // Récupérer le prix du token via l'oracle
          try {
            await readContract(wagmiConfig, {
              abi: mockPriceFeedAbi.abi,
              address: oracleAddress as `0x${string}`,
              functionName: 'getPrice',
              args: [alloc.token],
            })
          } catch {
            // fallback: 1
          }
          // Calcul de la valeur estimée (pondération * totalAssets)
          const percent = Number(alloc.weight) / 1e16 / 100 // 1e18 -> %
          const value = (Number(totalAssets) * percent) / 100
          return {
            symbol: tokenInfo.symbol,
            percent,
            value: value / 10 ** 6, // On suppose 6 décimales USDC
          }
        })
      const results = (await Promise.all(promises)).filter(Boolean) as {
        symbol: string
        percent: number
        value: number
      }[]
      setBreakdown(results)
    })()
  }, [allocations, registeredTokens, totalAssets, oracleAddress])

  if (!breakdown.length) return <div>Chargement de la répartition...</div>

  return (
    <div className="rwa-breakdown">
      <ul>
        {breakdown.map((item) => (
          <li key={item.symbol} style={{ marginBottom: 8 }}>
            <strong>{item.symbol}</strong> : {item.percent.toFixed(2)}% —{' '}
            {item.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}{' '}
            USDC
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RWABreakdown
