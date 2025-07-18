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
  const { assetDecimals } = useVault()

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
      toast.success('✅ Dépôt effectué avec succès !')
      setAmount('')
      setTxHash(undefined)
      window.dispatchEvent(new Event('vault-refresh'))
    }
    if (isTxError) {
      setContractError('Erreur lors de la confirmation de la transaction.')
      setTxHash(undefined)
    }
  }, [isTxSuccess, isTxError])

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

    try {
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
