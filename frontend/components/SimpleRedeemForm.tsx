'use client'

import React, { useState, useEffect } from 'react'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { writeContract, readContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import { useVault } from '@/context/VaultContext'
import { useUserPortfolio } from '@/hooks/useUserPortfolio'

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
  const [exitFeeBps, setExitFeeBps] = useState<number | null>(null)

  const { isConnected, address } = useAccount()
  const { decimals, assetDecimals } = useVault()
  const { currentValue: maxWithdrawable } = useUserPortfolio()

  // Le montant maximum retirable reste le même (les frais sont prélevés sur le montant demandé)
  const maxWithdrawableAmount =
    typeof maxWithdrawable === 'number' && !isNaN(maxWithdrawable)
      ? maxWithdrawable
      : 0

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
      // ✅ PHASE 1 - Plus besoin de mettre à jour le snapshot
      // La logique ERC-4626 convertToAssets(userShares) gère tout automatiquement
      console.log(
        '✅ Retrait réussi - convertToAssets(userShares) sera mis à jour automatiquement'
      )

      toast.success('✅ Retrait effectué avec succès !', {
        description:
          'Vos fonds ont été convertis en USDC et transférés vers votre wallet.',
        duration: 5000,
      })
      setAmount('')
      setTxHash(undefined)

      // Refresh immédiat pour mettre à jour les données
      setTimeout(() => {
        // Rafraîchir les données du Vault et de l'historique utilisateur
        window.dispatchEvent(new Event('vault-refresh'))
        window.dispatchEvent(new Event('user-data-refresh'))
      }, 2000) // Petit délai pour laisser le temps à la blockchain
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

  // Récupérer les frais de sortie
  useEffect(() => {
    const fetchExitFee = async () => {
      try {
        const bps = await readContract(wagmiConfig, {
          abi: vaultAbi,
          address: vaultAddress as `0x${string}`,
          functionName: 'exitFeeBps',
        })
        setExitFeeBps(Number(bps))
      } catch (error) {
        console.error('Erreur récupération frais de sortie:', error)
        setExitFeeBps(null)
      }
    }

    if (isConnected) {
      fetchExitFee()
    }
  }, [isConnected])

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

    if (maxWithdrawableAmount > 0 && amountFloat > maxWithdrawableAmount) {
      setContractError('Le montant dépasse votre solde disponible.')
      return
    }

    setContractError(null)
    setIsLoading(true)

    try {
      // Récupérer les parts de l'utilisateur
      const userShares = (await readContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'balanceOf',
        args: [address],
      })) as bigint

      if (!userShares || userShares === 0n) {
        setContractError("Vous n'avez pas de parts à retirer.")
        return
      }

      // Convertir le montant USDC en parts
      const amountBigInt = parseUnits(amount, assetDecimals || 18)
      const sharesNeeded = (await readContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'convertToShares',
        args: [amountBigInt],
      })) as bigint

      // Vérifier que l'utilisateur a assez de parts
      if (sharesNeeded > userShares) {
        setContractError("Vous n'avez pas assez de parts pour ce retrait.")
        return
      }

      // Effectuer le retrait
      const hash = await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'redeem',
        args: [sharesNeeded, address, address],
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
    if (maxWithdrawableAmount > 0 && !isNaN(maxWithdrawableAmount)) {
      setAmount(maxWithdrawableAmount.toFixed(2))
    }
  }

  // Validation en temps réel pour afficher les erreurs
  const amountFloat = amount ? parseFloat(amount) : 0
  const isAmountTooHigh =
    maxWithdrawableAmount > 0 && amountFloat > maxWithdrawableAmount

  // Afficher l'erreur de solde insuffisant en temps réel
  useEffect(() => {
    if (isAmountTooHigh && !contractError) {
      setContractError('Le montant dépasse votre solde disponible.')
    } else if (
      !isAmountTooHigh &&
      contractError?.includes('solde disponible')
    ) {
      setContractError(null)
    }
  }, [isAmountTooHigh, contractError])

  const isDisabled =
    !isConnected ||
    !amount ||
    parseFloat(amount) < MINIMUM_WITHDRAWAL ||
    (maxWithdrawableAmount > 0 && parseFloat(amount) > maxWithdrawableAmount) ||
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
            max={maxWithdrawableAmount > 0 ? maxWithdrawableAmount : undefined}
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
              disabled={maxWithdrawableAmount === 0}
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
              {maxWithdrawableAmount === 0
                ? '...'
                : `${maxWithdrawableAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
            </span>
          </div>
        </div>

        {amount && parseFloat(amount) > 0 && exitFeeBps !== null && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">
              Détails du retrait :
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant demandé :</span>
                <span className="font-medium">
                  {parseFloat(amount).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frais de sortie :</span>
                <span className="font-medium text-red-600">
                  -
                  {((parseFloat(amount) * exitFeeBps) / 10000).toLocaleString(
                    'fr-FR',
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}{' '}
                  USDC ({(exitFeeBps / 100).toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-gray-700 font-medium">
                  Montant net reçu :
                </span>
                <span className="font-bold text-green-600">
                  {(
                    parseFloat(amount) -
                    (parseFloat(amount) * exitFeeBps) / 10000
                  ).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  USDC
                </span>
              </div>
            </div>
          </div>
        )}

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
