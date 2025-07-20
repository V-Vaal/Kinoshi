import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { mockOracleAddress } from '@/constants'
import { mockTokenAddresses } from '@/constants'

export type OraclePriceEvent = {
  token: string
  symbol: string
  price: number
  decimals: number
  date: Date
  txHash: string
  blockNumber: bigint
  priceChange?: {
    oldPrice: number
    percentageChange: number
    isPositive: boolean
  }
}

export function useOraclePriceEvents() {
  const [priceEvents, setPriceEvents] = useState<OraclePriceEvent[]>([])
  // Initialiser avec des prix de référence différents pour tester les variations
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({
    [mockTokenAddresses.mGOLD]: 2000, // Prix de référence différent du prix actuel (4500)
    [mockTokenAddresses.mBTC]: 45000, // Prix de référence différent du prix actuel (145000)
    [mockTokenAddresses.mBONDS]: 100, // Prix de référence différent du prix actuel (400)
    [mockTokenAddresses.mEQUITY]: 50, // Prix de référence différent du prix actuel (87.5)
  })
  const publicClient = usePublicClient()

  // Fonction pour obtenir le symbole du token
  const getTokenSymbol = (tokenAddress: string): string => {
    const symbols: Record<string, string> = {
      [mockTokenAddresses.mGOLD]: 'GOLD',
      [mockTokenAddresses.mBTC]: 'BTC',
      [mockTokenAddresses.mBONDS]: 'BONDS',
      [mockTokenAddresses.mEQUITY]: 'EQUITY',
    }
    return symbols[tokenAddress] || 'UNKNOWN'
  }

  // Écouter les événements PriceSet
  useEffect(() => {
    if (!publicClient) return

    const fetchPriceEvents = async () => {
      try {
        // Récupérer les événements PriceSet depuis le dernier bloc
        const events = await publicClient.getLogs({
          address: mockOracleAddress as `0x${string}`,
          event: {
            type: 'event',
            name: 'PriceSet',
            inputs: [
              {
                type: 'address',
                name: 'token',
                indexed: true,
              },
              {
                type: 'uint256',
                name: 'price',
                indexed: false,
              },
              {
                type: 'uint8',
                name: 'decimals',
                indexed: false,
              },
            ],
          },
          fromBlock: 'latest',
          toBlock: 'latest',
        })

        // Traiter les événements
        const newEvents: OraclePriceEvent[] = events.map((log) => {
          const token = log.args.token as string
          const price = log.args.price as bigint
          const decimals = log.args.decimals as number
          const symbol = getTokenSymbol(token)
          const newPrice = parseFloat(formatUnits(price, decimals))
          const oldPrice = previousPrices[token]

          // Calculer la variation de prix si on a un prix précédent
          let priceChange: OraclePriceEvent['priceChange'] | undefined
          if (oldPrice && oldPrice !== newPrice) {
            const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100
            priceChange = {
              oldPrice,
              percentageChange,
              isPositive: percentageChange > 0,
            }
          }

          return {
            token,
            symbol,
            price: newPrice,
            decimals,
            date: new Date(),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            priceChange,
          }
        })

        // Mettre à jour les prix précédents après avoir traité tous les événements
        const newPreviousPrices = { ...previousPrices }
        newEvents.forEach((event) => {
          newPreviousPrices[event.token] = event.price
        })
        setPreviousPrices(newPreviousPrices)

        // Ajouter les nouveaux événements à l'historique (éviter les doublons)
        if (newEvents.length > 0) {
          setPriceEvents((prev) => {
            // Éviter les doublons basés sur txHash
            const existingTxHashes = new Set(prev.map((e) => e.txHash))
            const uniqueNewEvents = newEvents.filter(
              (event) => !existingTxHashes.has(event.txHash)
            )

            if (uniqueNewEvents.length > 0) {
              return [...uniqueNewEvents, ...prev]
            }

            return prev
          })
        }
      } catch (error) {
        console.log('🔍 Oracle Price Events Error:', error)
      }
    }

    // Écouter les événements en temps réel
    const unwatch = publicClient.watchEvent({
      address: mockOracleAddress as `0x${string}`,
      event: {
        type: 'event',
        name: 'PriceSet',
        inputs: [
          {
            type: 'address',
            name: 'token',
            indexed: true,
          },
          {
            type: 'uint256',
            name: 'price',
            indexed: false,
          },
          {
            type: 'uint8',
            name: 'decimals',
            indexed: false,
          },
        ],
      },
      onLogs: (logs) => {
        const newEvents: OraclePriceEvent[] = logs.map((log) => {
          const token = log.args.token as string
          const price = log.args.price as bigint
          const decimals = log.args.decimals as number
          const symbol = getTokenSymbol(token)
          const newPrice = parseFloat(formatUnits(price, decimals))
          const oldPrice = previousPrices[token]

          // Calculer la variation de prix si on a un prix précédent
          let priceChange: OraclePriceEvent['priceChange'] | undefined
          if (oldPrice && oldPrice !== newPrice) {
            const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100
            priceChange = {
              oldPrice,
              percentageChange,
              isPositive: percentageChange > 0,
            }
          }

          return {
            token,
            symbol,
            price: newPrice,
            decimals,
            date: new Date(),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            priceChange,
          }
        })

        // Mettre à jour les prix précédents après avoir traité tous les événements
        const newPreviousPrices = { ...previousPrices }
        newEvents.forEach((event) => {
          newPreviousPrices[event.token] = event.price
        })
        setPreviousPrices(newPreviousPrices)

        // Éviter les doublons basés sur txHash
        setPriceEvents((prev) => {
          const existingTxHashes = new Set(prev.map((e) => e.txHash))
          const uniqueNewEvents = newEvents.filter(
            (event) => !existingTxHashes.has(event.txHash)
          )

          if (uniqueNewEvents.length > 0) {
            return [...uniqueNewEvents, ...prev]
          }

          return prev
        })
      },
    })

    // Récupérer les événements historiques au premier chargement
    fetchPriceEvents()

    return () => {
      unwatch()
    }
  }, [publicClient])

  return {
    priceEvents,
    clearPriceEvents: () => setPriceEvents([]),
  }
}
