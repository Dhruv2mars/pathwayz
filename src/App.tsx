import { useEffect } from 'react'
import { initializeAuthListener } from '@/lib/auth'
import { useUserStore } from '@/store/userStore'

function App() {
  const { user, isLoading } = useUserStore()

  useEffect(() => {
    const unsubscribe = initializeAuthListener()
    return () => unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Pathwayz
        </h1>
        {user ? (
          <div className="text-center">
            <p className="text-lg mb-4">Hello, {user.email}!</p>
            <p className="text-gray-600">You are logged in.</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-4">Please log in to continue.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App