'use client'

import React, { useState } from 'react'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { isAddress } from 'viem'
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import tokenRegistryAbiJson from '@/abis/TokenRegistry.abi.json'
import type { Abi } from 'viem'
import { tokenRegistryAddress } from '@/constants'
import {
  Plus,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Coins,
  AlertCircle,
} from 'lucide-react'

const tokenRegistryAbi = (tokenRegistryAbiJson.abi ??
  tokenRegistryAbiJson) as Abi

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
    <div className="space-y-6">
      {/* Formulaire d'ajout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter un Token
          </CardTitle>
          <CardDescription>
            Enregistrez un nouveau token dans le registre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddToken} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Adresse du Token</Label>
                <Input
                  id="tokenAddress"
                  placeholder="0x..."
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenName">Nom du Token</Label>
                <Input
                  id="tokenName"
                  placeholder="Ex: Bitcoin"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isAdding || !addAddress || !addName}
              className="w-full md:w-auto"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter le Token
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Tokens Enregistrés
          </CardTitle>
          <CardDescription>
            Gérez les tokens disponibles dans le vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Chargement des tokens...</span>
            </div>
          ) : registeredTokens.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>Aucun token enregistré</span>
            </div>
          ) : (
            <div className="space-y-3">
              {registeredTokens.map((token, index) => (
                <div key={token.tokenAddress}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.symbol}</span>
                          <Badge
                            variant={
                              token.isRegistered ? 'default' : 'secondary'
                            }
                          >
                            {token.isRegistered ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        {token.tokenAddress}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(token.tokenAddress)}
                      disabled={toggleLoading === token.tokenAddress}
                      className="ml-4"
                    >
                      {toggleLoading === token.tokenAddress ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : token.isRegistered ? (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          Activer
                        </>
                      )}
                    </Button>
                  </div>
                  {index < registeredTokens.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TokenManager
