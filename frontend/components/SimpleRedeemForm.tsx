'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { writeContract, readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
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
import { ArrowUp, Loader2, Info } from 'lucide-react'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as readonly unknown[]

const errorMessages: Record<string, string> = {
  Paused: 'Les dépôts/retraits sont actuellement suspendus.',
  ZeroAmount: 'Veuillez saisir un montant supérieur à 0.',
  Unauthorized: 'Action non autorisée.',
  MinimumWithdrawalNotMet: 'Le montant minimum de retrait est de 50 USDC.',
}

const MINIMUM_WITHDRAWAL = 50 // 50 USDC

const SimpleRedeemForm: React.FC = () => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [maxWithdrawable, setMaxWithdrawable] = useState<string>('0')

  const { isConnected, address } = useAccount()
  const { userShares, decimals, assetDecimals, previewRedeem } = useVault()

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
      toast.success('✅ Retrait effectué avec succès !', {
        description:
          'Vos fonds ont été convertis en USDC et transférés vers votre wallet.',
        duration: 5000,
      })
      setAmount('')
      setTxHash(undefined)
      // Rafraîchir les données du Vault
      window.dispatchEvent(new Event('vault-refresh'))
    }
    if (isTxError) {
      const errorMessage = 'Erreur lors de la confirmation de la transaction.'
      setContractError(errorMessage)
      setTxHash(undefined)

      // Toast d'erreur
      toast.error('❌ Échec du retrait', {
        description: errorMessage,
        duration: 5000,
      })
    }
  }, [isTxSuccess, isTxError])

  // Calculer le montant maximum retirable
  useEffect(() => {
    const calculateMaxWithdrawable = async () => {
      if (!userShares || !decimals || !previewRedeem) {
        setMaxWithdrawable('0')
        return
      }

      try {
        const maxAmount = await previewRedeem(userShares)
        const maxFormatted = formatUnits(maxAmount, assetDecimals || 18)
        setMaxWithdrawable(maxFormatted)
      } catch (error) {
        console.error('Erreur calcul max retirable:', error)
        setMaxWithdrawable('0')
      }
    }

    calculateMaxWithdrawable()
  }, [userShares, decimals, previewRedeem, assetDecimals])

  const handleRedeem = async () => {
    if (!amount || !decimals || !address) {
      return
    }

    const amountFloat = parseFloat(amount)
    if (amountFloat < MINIMUM_WITHDRAWAL) {
      setContractError(
        `Le montant minimum de retrait est de ${MINIMUM_WITHDRAWAL} USDC.`
      )
      return
    }

    if (amountFloat > parseFloat(maxWithdrawable)) {
      setContractError('Le montant dépasse votre solde disponible.')
      return
    }

    setContractError(null)
    setIsLoading(true)

    try {
      // Convertir le montant USDC en parts
      const amountBigInt = parseUnits(amount, assetDecimals || 18)
      const shares = await readContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'convertToShares',
        args: [amountBigInt],
      })

      // Effectuer le retrait
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'redeem',
        args: [shares as bigint, address, address],
      })

      setTxHash(hash as `0x${string}`)
    } catch (error) {
      let message = 'Erreur lors du retrait. Veuillez réessayer.'
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
      toast.error('❌ Erreur de retrait', {
        description: message,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMaxWithdraw = () => {
    if (maxWithdrawable !== '0') {
      setAmount(maxWithdrawable)
    }
  }

  const isDisabled =
    !isConnected ||
    !amount ||
    parseFloat(amount) < MINIMUM_WITHDRAWAL ||
    parseFloat(amount) > parseFloat(maxWithdrawable) ||
    isLoading ||
    isTxLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="w-5 h-5" />
          Retirer des fonds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractError && (
          <Alert variant="destructive">
            <AlertDescription>{contractError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="withdraw-amount">Montant à retirer (USDC)</Label>
          <Input
            id="withdraw-amount"
            type="number"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MINIMUM_WITHDRAWAL}
            max={maxWithdrawable}
            step="0.01"
            disabled={isLoading || isTxLoading}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Montant minimum : {MINIMUM_WITHDRAWAL} USDC
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaxWithdraw}
              disabled={maxWithdrawable === '0'}
            >
              Max
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="w-4 h-4 text-blue-600" />
          <div className="text-sm">
            <span className="text-gray-600">Solde disponible : </span>
            <span className="font-semibold text-blue-900">
              {maxWithdrawable === '0'
                ? '...'
                : `${parseFloat(maxWithdrawable).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
            </span>
          </div>
        </div>

        <Button
          onClick={handleRedeem}
          disabled={isDisabled}
          className="w-full"
          size="lg"
        >
          {(isLoading || isTxLoading) && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {isLoading || isTxLoading ? 'Transaction en cours...' : 'Retirer'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default SimpleRedeemForm
