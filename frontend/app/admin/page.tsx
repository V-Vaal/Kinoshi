'use client'

import React from 'react'
import AdminPanel from '@/components/admin/AdminPanel'
import TokenManager from '@/components/admin/TokenManager'
import AuthGuard from '@/components/AuthGuard'

const AdminPage: React.FC = () => {
  return (
    <AuthGuard requireAdmin={true}>
      <div className="w-full">
        <div className="flex justify-center items-center min-h-[200px] mb-12">
          <div className="relative px-8 sm:px-12 py-10 sm:py-12 rounded-3xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-600/30 backdrop-blur-xl shadow-2xl max-w-5xl w-full mx-4">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-slate-800/10 rounded-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-extrabold text-white drop-shadow-lg tracking-tight text-center">
                  Administration
                </h1>
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div className="flex items-center justify-center">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <p className="text-xl font-sans font-medium text-white/90 tracking-wide text-center px-6">
                  Gérez les paramètres du vault et les tokens autorisés
                </p>
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto space-y-12">
          {/* Section Paramètres du Vault */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg"></div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  Paramètres du Vault
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
              </div>
              <p className="text-blue-100/80 text-lg ml-6">
                Configurez les frais, la stratégie d'allocation et les outils de
                démonstration
              </p>
            </div>
            <AdminPanel />
          </div>

          {/* Section Gestion des Tokens */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-lg"></div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  Gestion des Tokens
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/50 to-transparent"></div>
              </div>
              <p className="text-emerald-100/80 text-lg ml-6">
                Ajoutez et gérez les tokens autorisés dans le vault
              </p>
            </div>
            <TokenManager />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default AdminPage
