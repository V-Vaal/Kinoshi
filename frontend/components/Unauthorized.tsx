'use client'

import { useRouter } from 'next/navigation'

export default function Unauthorized() {
  const router = useRouter()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: '2rem',
      }}
    >
      <h2 style={{ color: '#d32f2f', fontWeight: 600 }}>Accès non autorisé</h2>
      <p>
        Votre portefeuille n’est pas encore autorisé à utiliser Kinoshi.
        <br />
        Merci de vous connecter et de remplir un petit questionnaire.
      </p>
      <button
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          borderRadius: 8,
          background: '#1976d2',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={() => router.push('/')}
      >
        Retour à l’accueil
      </button>
    </div>
  )
}
