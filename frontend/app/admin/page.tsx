'use client'

import React from 'react'
import AdminPanel from '@/components/AdminPanel'
import TokenManager from '@/components/TokenManager'
import AuthGuard from '@/components/AuthGuard'

const AdminPage: React.FC = () => {
  return (
    <AuthGuard requireAdmin={true}>
      <div className="w-full">
        <div className="flex justify-center items-center min-h-[180px] mb-8">
          <div className="relative px-6 sm:px-10 py-8 sm:py-10 rounded-3xl bg-white/15 border border-[var(--kinoshi-accent)]/30 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-white drop-shadow-lg mb-4 tracking-tight text-center">
              Administration
            </h1>
            <p className="text-lg font-sans font-medium text-white/95 tracking-wide text-center">
              Gérez les paramètres du vault et les tokens autorisés.
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <AdminPanel />
          <TokenManager />
        </div>
      </div>
    </AuthGuard>
  )
}

export default AdminPage
