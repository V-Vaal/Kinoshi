'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useTokenRegistry } from '@/context/TokenRegistryContext'
import { readContract, writeContract } from 'wagmi/actions'
import { wagmiConfig } from '@/components/RainbowKitAndWagmiProvider'
import vaultAbiJson from '@/abis/Vault.abi.json'
import { vaultAddress } from '@/constants'
import type { Abi } from 'viem'
import { toast } from 'sonner'
import AdminOraclePriceEditor from './AdminOraclePriceEditor'
import TreasuryManager from './TreasuryManager'
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

import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  PieChart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react'

const vaultAbi = (vaultAbiJson.abi ?? vaultAbiJson) as Abi

const AdminPanel: React.FC = () => {
  const { isAdmin } = useUser()
  const { registeredTokens, allocations, fetchTokenData } = useTokenRegistry()
  const [exitFee, setExitFee] = useState('')
  const [mgmtFee, setMgmtFee] = useState('')
  const [currentExitFee, setCurrentExitFee] = useState('')
  const [currentMgmtFee, setCurrentMgmtFee] = useState('')
  const [feeLoading, setFeeLoading] = useState(false)
  const [allocs, setAllocs] = useState<
    { token: string; weight: string; active: boolean }[]
  >([])
  const [allocLoading, setAllocLoading] = useState(false)
  const [allocError, setAllocError] = useState('')

  // Lecture des frais actuels
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const [exit, mgmt] = await Promise.all([
          readContract(wagmiConfig, {
            abi: vaultAbi,
            address: vaultAddress as `0x${string}`,
            functionName: 'exitFeeBps',
          }),
          readContract(wagmiConfig, {
            abi: vaultAbi,
            address: vaultAddress as `0x${string}`,
            functionName: 'managementFeeBps',
          }),
        ])
        setCurrentExitFee((Number(exit) / 100).toString())
        setCurrentMgmtFee((Number(mgmt) / 100).toString())
        setExitFee((Number(exit) / 100).toString())
        setMgmtFee((Number(mgmt) / 100).toString())
      } catch {
        setCurrentExitFee('')
        setCurrentMgmtFee('')
      }
    }
    if (isAdmin) fetchFees()
  }, [isAdmin])

  // Lecture des allocations actuelles
  useEffect(() => {
    if (isAdmin && allocations.length) {
      setAllocs(
        allocations.map((a) => ({
          token: a.token,
          weight: (Number(a.weight) / 1e16).toString(), // %
          active: a.active,
        }))
      )
    }
  }, [isAdmin, allocations])

  // Handler update fees
  const handleUpdateFees = async () => {
    setFeeLoading(true)
    try {
      const exitBps = Math.round(Number(exitFee) * 100)
      const mgmtBps = Math.round(Number(mgmtFee) * 100)
      if (exitBps > 1000 || mgmtBps > 1000) {
        toast.error('Frais trop élevés (max 10%)')
        setFeeLoading(false)
        return
      }
      await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'setFees',
        args: [exitBps, mgmtBps],
      })
      toast.success('Frais mis à jour !')
      setCurrentExitFee(exitFee)
      setCurrentMgmtFee(mgmtFee)
    } catch {
      toast.error('Erreur lors de la mise à jour des frais')
    } finally {
      setFeeLoading(false)
    }
  }

  // Handler update allocations
  const handleUpdateAllocs = async () => {
    setAllocLoading(true)
    setAllocError('')
    try {
      const total = allocs.reduce((acc, a) => acc + Number(a.weight), 0)
      if (Math.abs(total - 100) > 0.01) {
        setAllocError('Le total doit être égal à 100%')
        setAllocLoading(false)
        return
      }
      const weights = allocs.map((a) =>
        BigInt(Math.round(Number(a.weight) * 1e16))
      )
      const actives = allocs.map((a) => a.active)
      await writeContract(wagmiConfig, {
        abi: vaultAbi,
        address: vaultAddress as `0x${string}`,
        functionName: 'setAllocations',
        args: [weights, actives],
      })
      toast.success('Stratégie mise à jour !')
      await fetchTokenData()
    } catch {
      toast.error('Erreur lors de la mise à jour de la stratégie')
    } finally {
      setAllocLoading(false)
    }
  }

  const totalWeight = allocs.reduce((acc, a) => acc + Number(a.weight), 0)
  const isTotalValid = Math.abs(totalWeight - 100) < 0.01

  return (
    <div className="space-y-6">
      <Tabs defaultValue="fees" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Frais
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Stratégie
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Outils
          </TabsTrigger>
        </TabsList>

        {/* Section Frais */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Gestion des Frais
              </CardTitle>
              <CardDescription>
                Configurez les frais de sortie et de gestion du vault
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exitFee">Frais de sortie (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="exitFee"
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={exitFee}
                      onChange={(e) => setExitFee(e.target.value)}
                      className="w-24"
                    />
                    <Badge variant="secondary">Actuel: {currentExitFee}%</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mgmtFee">Frais de gestion (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="mgmtFee"
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={mgmtFee}
                      onChange={(e) => setMgmtFee(e.target.value)}
                      className="w-24"
                    />
                    <Badge variant="secondary">Actuel: {currentMgmtFee}%</Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleUpdateFees}
                disabled={feeLoading}
                className="w-full md:w-auto"
              >
                {feeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mettre à jour les frais
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section Stratégie */}
        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Gestion de la Stratégie
              </CardTitle>
              <CardDescription>
                Configurez les pondérations et l'activation des tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {allocs.map((a, idx) => {
                  const t = registeredTokens.find(
                    (tk) =>
                      tk.tokenAddress.toLowerCase() === a.token.toLowerCase()
                  )
                  return (
                    <div
                      key={a.token}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Label className="font-medium">
                          {t?.symbol || 'Token'}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={a.weight}
                          onChange={(e) => {
                            const v = e.target.value
                            setAllocs((all) =>
                              all.map((x, i) =>
                                i === idx ? { ...x, weight: v } : x
                              )
                            )
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={a.active}
                          onChange={(e) =>
                            setAllocs((all) =>
                              all.map((x, i) =>
                                i === idx
                                  ? { ...x, active: e.target.checked }
                                  : x
                              )
                            )
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-muted-foreground">
                          {a.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Total:</span>
                  <Badge variant={isTotalValid ? 'default' : 'destructive'}>
                    {totalWeight.toFixed(2)}%
                  </Badge>
                  {!isTotalValid && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                {allocError && (
                  <span className="text-sm text-destructive">{allocError}</span>
                )}
              </div>

              <Button
                onClick={handleUpdateAllocs}
                disabled={allocLoading || !isTotalValid}
                className="w-full"
              >
                {allocLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mettre à jour la stratégie
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section Outils */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Éditeur de Prix Oracle
                </CardTitle>
                <CardDescription>
                  Modifiez les prix des tokens pour les tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminOraclePriceEditor />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Gestionnaire de Trésorerie
                </CardTitle>
                <CardDescription>
                  Gérez les balances et les frais collectés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TreasuryManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPanel
