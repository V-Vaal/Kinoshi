'use client'

import React from 'react'
import { formatUnits } from 'viem'
import { useVault } from '@/context/VaultContext'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { RefreshCw } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { totalAssets, userShares, decimals, fetchVaultData } = useVault()

  // Fonction pour formater les valeurs bigint en string lisible
  const formatValue = (
    value: bigint | null,
    decimals: number | null
  ): string => {
    if (value === null || decimals === null) {
      return 'Non disponible'
    }

    try {
      const formatted = formatUnits(value, decimals)
      // Ajoute des espaces pour les milliers et limite à 2 décimales
      const parts = formatted.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      const result =
        parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0]
      return `${result} USDC`
    } catch (error) {
      return 'Erreur de formatage'
    }
  }

  const handleRefresh = async () => {
    try {
      await fetchVaultData()
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Tableau de bord
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Rafraîchir
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Total des actifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Total des actifs
              </h3>
              <p className="text-3xl font-bold text-blue-900">
                {formatValue(totalAssets, decimals)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Valeur totale sous gestion
              </p>
            </div>

            {/* Parts de l'utilisateur */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Vos parts
              </h3>
              <p className="text-3xl font-bold text-green-900">
                {formatValue(userShares, decimals)}
              </p>
              <p className="text-sm text-green-600 mt-1">Parts détenues</p>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-semibold text-gray-700 mb-3">
              Informations techniques
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Décimales du token :</span>
                <span className="ml-2 font-mono font-semibold">
                  {decimals !== null ? decimals : 'Non disponible'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Assets (raw) :</span>
                <span className="ml-2 font-mono text-xs">
                  {totalAssets !== null
                    ? totalAssets.toString()
                    : 'Non disponible'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">User Shares (raw) :</span>
                <span className="ml-2 font-mono text-xs">
                  {userShares !== null
                    ? userShares.toString()
                    : 'Non disponible'}
                </span>
              </div>
            </div>
          </div>

          {/* État de connexion */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
