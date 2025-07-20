import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { AssetAllocation } from '@/context/TokenRegistryContext'

export interface RWASnapshotItem {
  tokenAddress: string
  symbol: string
  amountInvested: number // USDC investi dans ce token
  oraclePrice: number // Prix oracle au moment du dépôt
  tokenQuantity: number // Quantité de tokens RWA (figée)
  allocationPercent: number // Pourcentage d'allocation
  timestamp: number // Timestamp du dépôt
}

export interface RWASnapshot {
  userAddress: string
  totalInvested: number // Montant initial investi
  items: RWASnapshotItem[]
  withdrawalsProcessed: number // Montant total des retraits traités
  lastUpdated: number
}

const STORAGE_KEY = 'kinoshi_rwa_snapshots'

export const useRWASnapshot = () => {
  const { address } = useAccount()
  const [snapshot, setSnapshot] = useState<RWASnapshot | null>(null)

  // Charger le snapshot depuis localStorage
  useEffect(() => {
    if (!address) {
      setSnapshot(null)
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const snapshots: Record<string, RWASnapshot> = JSON.parse(stored)
        const userSnapshot = snapshots[address]
        if (userSnapshot) {
          setSnapshot(userSnapshot)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du snapshot RWA:', error)
    }
  }, [address])

  // Sauvegarder le snapshot dans localStorage
  const saveSnapshot = (newSnapshot: RWASnapshot) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const snapshots: Record<string, RWASnapshot> = stored
        ? JSON.parse(stored)
        : {}

      snapshots[address!] = newSnapshot
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))

      setSnapshot(newSnapshot)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du snapshot RWA:', error)
    }
  }

  // Créer un nouveau snapshot lors d'un dépôt
  const createSnapshot = (
    totalInvested: number,
    allocations: AssetAllocation[],
    oraclePrices: Record<string, number>
  ) => {
    if (!address || !allocations.length) return

    const items: RWASnapshotItem[] = allocations
      .filter((allocation) => allocation.active)
      .map((allocation) => {
        const allocationPercent =
          parseFloat(formatUnits(allocation.weight, 18)) * 100
        const amountInvestedInToken = totalInvested * (allocationPercent / 100)
        const oraclePrice = oraclePrices[allocation.token] || 1

        // Quantité de tokens RWA = montant investi / prix oracle au moment du dépôt
        const tokenQuantity = amountInvestedInToken / oraclePrice

        return {
          tokenAddress: allocation.token,
          symbol: getTokenSymbol(allocation.token),
          amountInvested: amountInvestedInToken,
          oraclePrice,
          tokenQuantity,
          allocationPercent,
          timestamp: Date.now(),
        }
      })

    const newSnapshot: RWASnapshot = {
      userAddress: address,
      totalInvested,
      items,
      withdrawalsProcessed: 0, // Aucun retrait traité au moment du dépôt
      lastUpdated: Date.now(),
    }

    saveSnapshot(newSnapshot)
  }

  // Fonction pour appliquer une réduction proportionnelle lors d'un retrait
  const applyWithdrawalToSnapshot = (
    snapshot: RWASnapshot,
    withdrawalAmount: number
  ): RWASnapshot => {
    const proportion = withdrawalAmount / snapshot.totalInvested
    return {
      ...snapshot,
      totalInvested: snapshot.totalInvested - withdrawalAmount,
      withdrawalsProcessed: snapshot.withdrawalsProcessed + withdrawalAmount,
      items: snapshot.items.map((item) => ({
        ...item,
        tokenQuantity: item.tokenQuantity * (1 - proportion), // Réduction proportionnelle
        amountInvested: item.amountInvested * (1 - proportion),
      })),
      lastUpdated: Date.now(),
    }
  }

  // Mettre à jour le snapshot lors d'un retrait
  const updateSnapshotOnWithdrawal = (withdrawalAmount: number) => {
    if (!snapshot) return

    const updatedSnapshot = applyWithdrawalToSnapshot(
      snapshot,
      withdrawalAmount
    )
    saveSnapshot(updatedSnapshot)
  }

  // Supprimer le snapshot (quand le portefeuille est vide)
  const clearSnapshot = () => {
    if (!address) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const snapshots: Record<string, RWASnapshot> = JSON.parse(stored)
        delete snapshots[address]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
        setSnapshot(null)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du snapshot RWA:', error)
    }
  }

  return {
    snapshot,
    createSnapshot,
    updateSnapshotOnWithdrawal,
    applyWithdrawalToSnapshot,
    clearSnapshot,
  }
}

// Fonction utilitaire pour obtenir le symbole du token
function getTokenSymbol(tokenAddress: string): string {
  const TOKEN_SYMBOLS: Record<string, string> = {
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512': 'GOLD',
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0': 'BTC',
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9': 'BONDS',
    '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9': 'EQUITY',
  }
  return TOKEN_SYMBOLS[tokenAddress] || 'UNKNOWN'
}
