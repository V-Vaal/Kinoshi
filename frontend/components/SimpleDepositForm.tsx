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

  const { isConnected, address: userAddress } = useAccount()
  const { assetDecimals, refreshUserData } = useVault()

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
      setTimeout(async () => {
        try {
          await refreshUserData()
          // Rafraîchir les données du Vault
          window.dispatchEvent(new Event('vault-refresh'))
          window.dispatchEvent(new Event('user-data-refresh'))
          console.log('✅ Deposit success - Data refreshed')
        } catch (error) {
          console.error('❌ Error refreshing data after deposit:', error)
        }
      }, 1000) // Petit délai pour laisser le temps à la blockchain
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

    setContractError(null)
    setIsLoading(true)

    // Dispatcher l'événement de début de dépôt
    window.dispatchEvent(
      new CustomEvent('deposit-start', {
        detail: { amount: amountFloat },
      })
    )

    try {
      console.log('🔄 Starting deposit...', { amount, assetDecimals })
      
      // Utiliser 18 décimales pour le parseUnits (assetDecimals devrait être 18)
      const amountBigInt = parseUnits(amount, assetDecimals)
      console.log('💰 Amount in wei:', amountBigInt.toString())

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

      console.log('🔐 Current allowance:', allowance.toString())

      if (allowance < amountBigInt) {
        console.log('🔐 Approving tokens...')
        // Approuver d'abord
        const approveHash = await writeContract(wagmiConfig, {
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
        
        console.log('✅ Approval hash:', approveHash)
        // Attendre la confirmation de l'approval
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      console.log('💸 Executing deposit...')
      // Effectuer le dépôt
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'deposit',
        args: [amountBigInt, userAddress],
      })

      console.log('✅ Deposit hash:', hash)
      setTxHash(hash as `0x${string}`)
    } catch (error) {
      console.error('❌ Deposit error:', error)
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
