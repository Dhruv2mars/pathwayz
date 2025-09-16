import { useEffect, useState } from 'react'
import { initializeAuthListener } from '@/lib/auth'
import { useUserStore } from '@/store/userStore'
import LandingPage from '@/pages/LandingPage'
import WelcomePage from '@/pages/WelcomePage'

function App() {
  const { user, isLoading } = useUserStore()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const unsubscribe = initializeAuthListener()
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (user) {
    return <WelcomePage />
  }

  return <LandingPage />
}

export default App