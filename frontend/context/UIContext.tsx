'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react'

export interface UIContextType {
  isLoading: boolean
  setLoading: (b: boolean) => void
  error: string | null
  setError: (msg: string | null) => void
  showModal: boolean
  setShowModal: (b: boolean) => void
  showToast: (msg: string) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  // Pour le toast, on peut utiliser un simple alert pour le placeholder
  const showToast = useCallback((msg: string) => {
    alert(msg)
  }, [])

  return (
    <UIContext.Provider
      value={{
        isLoading,
        setLoading,
        error,
        setError,
        showModal,
        setShowModal,
        showToast,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI doit être utilisé dans un UIProvider')
  return ctx
}
