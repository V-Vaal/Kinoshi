'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { writeContract, readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress, mockTokenAddresses } from '@/constants'
import { useVault } from '@/context/VaultContext'
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

      // Refresh immédiat pour mettre à jour les données
      ;(async () => {
        try {
          await refreshUserData()
          // Rafraîchir les données du Vault et de l'historique utilisateur
          window.dispatchEvent(new Event('vault-refresh'))
          window.dispatchEvent(new Event('user-data-refresh'))
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
    if (userBalance < amountBigInt) {
      setContractError('Solde USDC insuffisant pour effectuer ce dépôt.')
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
