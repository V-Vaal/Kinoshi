import Dashboard from '@/components/Dashboard'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Bienvenue sur Kinoshi
        </h1>
        <Dashboard />
      </div>
    </main>
  )
}
