'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { writeContract, readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress, mockTokenAddresses } from '@/constants'
import { useVault } from '@/context/VaultContext'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
// import { useRWASnapshot } from '@/hooks/useRWASnapshot' // 🚫 PHASE 1 - Supprimé
import { useUserHistory } from '@/utils/useUserHistory'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
} from '@/components/ui'
import { toast } from 'sonner'
import { useWaitForTransactionReceipt } from 'wagmi'
import { ArrowDown, Loader2 } from 'lucide-react'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as readonly unknown[]

const errorMessages: Record<string, string> = {
  Paused: 'Les dépôts/retraits sont actuellement suspendus.',
  ZeroAmount: 'Veuillez saisir un montant supérieur à 0.',
  Unauthorized: 'Action non autorisée.',
  MinimumDepositNotMet: 'Le montant minimum de dépôt est de 50 USDC.',
}

const SimpleDepositForm: React.FC = () => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [userBalance, setUserBalance] = useState<bigint | null>(null)

  const { isConnected, address: userAddress } = useAccount()
  const { assetDecimals, refreshUserData } = useVault()
  const { allocations } = useTokenRegistry()
  // const { createSnapshot } = useRWASnapshot() // 🚫 PHASE 1 - Supprimé
  const { refetchHistory } = useUserHistory(userAddress, 18)

  // Récupérer le solde USDC de l'utilisateur
  useEffect(() => {
    const fetchBalance = async () => {
      if (!userAddress) {
        setUserBalance(null)
        return
      }

      try {
        const balance = await readContract(wagmiConfig, {
          abi: [
            {
              inputs: [{ name: 'account', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          address: mockTokenAddresses.mUSDC as `0x${string}`,
          functionName: 'balanceOf',
          args: [userAddress],
        })
        setUserBalance(balance as bigint)
      } catch (error) {
        console.log('🔍 Balance Error:', error)
        setUserBalance(null)
      }
    }

    fetchBalance()

    // Écouter les événements de refresh
    const handler = () => fetchBalance()
    window.addEventListener('vault-refresh', handler)
    window.addEventListener('user-data-refresh', handler)
    return () => {
      window.removeEventListener('vault-refresh', handler)
      window.removeEventListener('user-data-refresh', handler)
    }
  }, [userAddress])

  // Effacer l'erreur si le solde devient suffisant
  useEffect(() => {
    if (amount && userBalance && assetDecimals) {
      const amountBigInt = parseUnits(amount, assetDecimals)

      if (
        userBalance >= amountBigInt &&
        contractError?.includes('Solde USDC insuffisant')
      ) {
        setContractError(null)
      }
    }
  }, [amount, userBalance, assetDecimals, contractError])

  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  useEffect(() => {
    if (isTxSuccess) {
      toast.success('✅ Investissement effectué avec succès !', {
        description:
          'Vos fonds ont été répartis selon votre stratégie. Vous pouvez consulter votre portefeuille pour voir la répartition.',
        duration: 5000,
      })
      setAmount('')
      setTxHash(undefined)

      // Dispatcher l'événement de succès
      window.dispatchEvent(new Event('deposit-success'))

      // Créer le snapshot RWA après un dépôt réussi
      const savedAmount = parseFloat(amount)
      if (savedAmount > 0 && allocations.length > 0) {
        // Récupérer les prix oracle actuels pour créer le snapshot
        const fetchOraclePrices = async () => {
          try {
            const { readContract } = await import('wagmi/actions')
            const { wagmiConfig } = await import(
              '@/components/RainbowKitAndWagmiProvider'
            )
            const { mockOracleAddress } = await import('@/constants')
            const mockPriceFeedAbiJson = await import(
              '@/abis/MockPriceFeed.abi.json'
            )

            const mockPriceFeedAbi = (mockPriceFeedAbiJson.abi ??
              mockPriceFeedAbiJson) as readonly unknown[]

            const prices: Record<string, number> = {}
            for (const allocation of allocations.filter((a) => a.active)) {
              try {
                const result = await readContract(wagmiConfig, {
                  abi: mockPriceFeedAbi,
                  address: mockOracleAddress as `0x${string}`,
                  functionName: 'getPrice',
                  args: [allocation.token],
                })
                const [price, decimals] = result as [bigint, number]
                prices[allocation.token] = parseFloat(
                  formatUnits(price, decimals)
                )
              } catch (error) {
                console.log(
                  'Oracle price error for snapshot:',
                  allocation.token,
                  error
                )
                // Fallback aux prix par défaut
                const defaultPrices: Record<string, number> = {
                  [mockTokenAddresses.mGOLD]: 2000,
                  [mockTokenAddresses.mBTC]: 45000,
                  [mockTokenAddresses.mBONDS]: 100,
                  [mockTokenAddresses.mEQUITY]: 50,
                }
                prices[allocation.token] = defaultPrices[allocation.token] || 1
              }
            }

            // ✅ PHASE 1 - Plus besoin de créer un snapshot
            // La logique ERC-4626 convertToAssets(userShares) gère tout automatiquement
            console.log(
              '✅ Dépôt réussi - convertToAssets(userShares) sera mis à jour automatiquement'
            )
          } catch (error) {
            console.error('Erreur lors de la création du snapshot RWA:', error)
          }
        }

        fetchOraclePrices()
      }

      // Refresh immédiat pour mettre à jour les données
      ;(async () => {
        try {
          await refreshUserData()
          // Refetch immédiat de l'historique pour avoir les nouvelles données
          await refetchHistory()

          // Rafraîchir les données du Vault et de l'historique utilisateur
          window.dispatchEvent(new Event('vault-refresh'))
          window.dispatchEvent(new Event('user-data-refresh'))

          // Forcer un refresh immédiat du portfolio
          setTimeout(() => {
            window.dispatchEvent(new Event('portfolio-refresh'))
          }, 1000) // Petit délai pour laisser le temps au snapshot d'être créé
        } catch {
          // Erreur silencieuse
        }
      })()
    }
    if (isTxError) {
      const errorMessage = 'Erreur lors de la confirmation de la transaction.'
      setContractError(errorMessage)
      setTxHash(undefined)

      // Toast d'erreur
      toast.error("❌ Échec de l'investissement", {
        description: errorMessage,
        duration: 5000,
      })

      // Dispatcher l'événement d'erreur
      window.dispatchEvent(new Event('deposit-error'))
    }
  }, [isTxSuccess, isTxError, refreshUserData])

  const handleDeposit = async () => {
    if (!amount || !assetDecimals || !isConnected || !userAddress) {
      return
    }

    const amountFloat = parseFloat(amount)
    if (amountFloat < 50) {
      setContractError('Le montant minimum de dépôt est de 50 USDC.')
      return
    }

    // Vérifier le solde USDC
    if (userBalance === null) {
      setContractError(
        'Impossible de vérifier votre solde USDC. Veuillez réessayer.'
      )
      return
    }

    const amountBigInt = parseUnits(amount, assetDecimals)

    // Debug: afficher les valeurs exactes
    const userBalanceFormatted = formatUnits(userBalance, assetDecimals)
    const amountFormatted = formatUnits(amountBigInt, assetDecimals)

    console.log('🔍 Validation solde:', {
      userBalance: userBalanceFormatted,
      amount: amountFormatted,
      userBalanceBigInt: userBalance.toString(),
      amountBigInt: amountBigInt.toString(),
      hasEnough: userBalance >= amountBigInt,
      difference: userBalance - amountBigInt,
    })

    // Supprimer complètement la marge de sécurité
    if (userBalance < amountBigInt) {
      setContractError(
        `Solde USDC insuffisant. Vous avez ${userBalanceFormatted} USDC, il faut ${amountFormatted} USDC.`
      )
      return
    }

    setContractError(null)
    setIsLoading(true)

    // Dispatcher l'événement de début de dépôt
    window.dispatchEvent(
      new CustomEvent('deposit-start', {
        detail: { amount: amountFloat },
      })
    )

    try {
      // Utiliser 18 décimales pour le parseUnits (assetDecimals devrait être 18)
      const amountBigInt = parseUnits(amount, assetDecimals)

      // Vérifier l'allowance
      const allowance = await readContract(wagmiConfig, {
        abi: [
          {
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        address: mockTokenAddresses.mUSDC as `0x${string}`,
        functionName: 'allowance',
        args: [userAddress, vaultAddress],
      })

      if (allowance < amountBigInt) {
        // Approuver d'abord
        await writeContract(wagmiConfig, {
          abi: [
            {
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              name: 'approve',
              outputs: [{ name: '', type: 'bool' }],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: mockTokenAddresses.mUSDC as `0x${string}`,
          functionName: 'approve',
          args: [vaultAddress, amountBigInt],
        })

        // Attendre la confirmation de l'approval
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Effectuer le dépôt
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'deposit',
        args: [amountBigInt, userAddress],
      })

      setTxHash(hash as `0x${string}`)
    } catch (error) {
      let message = 'Erreur lors du dépôt. Veuillez réessayer.'
      if (
        typeof error === 'object' &&
        error &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        const match = /Custom error: (\w+)/.exec(
          (error as { message: string }).message
        )
        if (match && errorMessages[match[1]]) {
          message = errorMessages[match[1]]
        }
      }
      setContractError(message)

      // Toast d'erreur
      toast.error('❌ Erreur de dépôt', {
        description: message,
        duration: 5000,
      })

      // Dispatcher l'événement d'erreur
      window.dispatchEvent(new Event('deposit-error'))
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled =
    !isConnected ||
    !amount ||
    parseFloat(amount) < 50 ||
    isLoading ||
    isTxLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="w-5 h-5" />
          Déposer des fonds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractError && (
          <Alert variant="destructive">
            <AlertDescription>{contractError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="deposit-amount">Montant à déposer (USDC)</Label>
          <Input
            id="deposit-amount"
            type="number"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="50"
            step="0.01"
            disabled={isLoading || isTxLoading}
          />
          <p className="text-sm text-gray-500">Montant minimum : 50 USDC</p>
          {assetDecimals && (
            <p className="text-xs text-gray-400">
              Décimales du token : {assetDecimals}
            </p>
          )}
        </div>

        <Button
          onClick={handleDeposit}
          disabled={isDisabled}
          className="w-full"
          size="lg"
        >
          {(isLoading || isTxLoading) && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {isLoading || isTxLoading ? 'Transaction en cours...' : 'Déposer'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default SimpleDepositForm
