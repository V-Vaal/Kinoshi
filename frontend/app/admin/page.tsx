'use client'

import React from 'react'
import AdminPanel from '@/components/AdminPanel'
import TokenManager from '@/components/TokenManager'
import RequireAuth from '@/components/RequireAuth'

const AdminPage: React.FC = () => {
  return (
    <RequireAuth adminOnly>
      <div className="space-y-12 py-8">
        <AdminPanel />
        <TokenManager />
      </div>
    </RequireAuth>
  )
}

export default AdminPage
