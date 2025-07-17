'use client'

import React, { useState } from 'react'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import {
  Button,
  Input,
  KinoshiCard,
  KinoshiCardHeader,
  KinoshiCardTitle,
  KinoshiCardContent,
  KinoshiBadge,
} from '@/components/ui'
import { toast } from 'sonner'
import { isAddress } from 'viem'
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import tokenRegistryAbiJson from '@/abis/TokenRegistry.abi.json'
import type { Abi } from 'viem'
const tokenRegistryAbi = (tokenRegistryAbiJson.abi ??
  tokenRegistryAbiJson) as Abi
import { tokenRegistryAddress } from '@/constants'

const TokenManager: React.FC = () => {
  const { registeredTokens, fetchTokenData, isLoading } = useTokenRegistry()
  const [addAddress, setAddAddress] = useState('')
  const [addName, setAddName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  // Activer/désactiver un token
  const handleToggle = async (tokenAddress: string) => {
    setToggleLoading(tokenAddress)
    try {
      const hash = await writeContract(wagmiConfig, {
        abi: tokenRegistryAbi,
        address: tokenRegistryAddress as `0x${string}`,
        functionName: 'toggleTokenStatus',
        args: [tokenAddress],
      })
      await waitForTransactionReceipt(wagmiConfig, { hash })
      toast.success('Statut du token mis à jour !')
      await fetchTokenData()
    } catch {
      toast.error('Erreur lors du changement de statut du token')
    } finally {
      setToggleLoading(null)
    }
  }

  // Ajouter un token
  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddress(addAddress)) {
      toast.error('Adresse invalide')
      return
    }
    if (!addName.trim()) {
      toast.error('Nom du token requis')
      return
    }
    setIsAdding(true)
    try {
      const hash = await writeContract(wagmiConfig, {
        abi: tokenRegistryAbi,
        address: tokenRegistryAddress as `0x${string}`,
        functionName: 'registerToken',
        args: [addAddress, addName],
      })
      await waitForTransactionReceipt(wagmiConfig, { hash })
      toast.success('Token ajouté avec succès !')
      setAddAddress('')
      setAddName('')
      await fetchTokenData()
    } catch {
      toast.error("Erreur lors de l'ajout du token")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-8">
      <KinoshiCard variant="outlined" className="max-w-3xl mx-auto">
        <KinoshiCardHeader>
          <KinoshiCardTitle>Gestion des tokens</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center text-[var(--kinoshi-text)]/70">
              Chargement...
            </div>
          ) : (
            <div className="space-y-4">
              {registeredTokens.length === 0 ? (
                <div className="text-center text-[var(--kinoshi-text)]/70">
                  Aucun token enregistré.
                </div>
              ) : (
                <div className="space-y-2">
                  {registeredTokens.map((token) => (
                    <div
                      key={token.tokenAddress}
                      className={`flex items-center justify-between p-4 border rounded-lg ${!token.isRegistered ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-sm">
                          {token.tokenAddress}
                        </span>
                        <span className="font-sans font-semibold text-lg">
                          {token.symbol}{' '}
                          {!token.isRegistered && (
                            <KinoshiBadge variant="danger">
                              désactivé
                            </KinoshiBadge>
                          )}
                        </span>
                      </div>
                      <div>
                        <Button
                          variant={
                            token.isRegistered ? 'destructive' : 'default'
                          }
                          onClick={() => handleToggle(token.tokenAddress)}
                          disabled={toggleLoading === token.tokenAddress}
                        >
                          {toggleLoading === token.tokenAddress
                            ? '...'
                            : token.isRegistered
                              ? 'Désactiver'
                              : 'Activer'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </KinoshiCardContent>
      </KinoshiCard>

      {/* Section ajout */}
      <KinoshiCard variant="outlined" className="max-w-3xl mx-auto">
        <KinoshiCardHeader>
          <KinoshiCardTitle>Ajouter un token</KinoshiCardTitle>
        </KinoshiCardHeader>
        <KinoshiCardContent>
          <form onSubmit={handleAddToken} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-sans font-medium">Adresse du token</label>
              <Input
                value={addAddress}
                onChange={(e) => setAddAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono"
                disabled={isAdding}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-sans font-medium">Nom symbolique</label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Ex: USDC"
                disabled={isAdding}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isAdding}>
                {isAdding ? 'Ajout...' : 'Ajouter le token'}
              </Button>
            </div>
          </form>
        </KinoshiCardContent>
      </KinoshiCard>
    </div>
  )
}

export default TokenManager
