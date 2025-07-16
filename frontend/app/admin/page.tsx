'use client'

import React from 'react'
import AdminPanel from '@/components/AdminPanel'
import TokenManager from '@/components/TokenManager'
import AdminGuard from '@/components/AdminGuard'

const AdminPage: React.FC = () => {
  return (
    <AdminGuard>
      <div className="w-full">
        <div className="flex justify-center items-center min-h-[220px] mb-8">
          <div className="relative px-6 sm:px-10 py-10 sm:py-12 rounded-3xl bg-white/10 border border-[var(--kinoshi-accent)]/40 backdrop-blur-xl shadow-2xl max-w-3xl w-full mx-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[var(--kinoshi-accent)] drop-shadow-lg mb-4 tracking-tight text-center">
              Administration
            </h1>
            <p className="text-lg font-sans font-medium text-white/90 tracking-wide text-center">
              Gérez les paramètres du vault et les tokens autorisés.
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <AdminPanel />
          <TokenManager />
        </div>
      </div>
    </AdminGuard>
  )
}

export default AdminPage
