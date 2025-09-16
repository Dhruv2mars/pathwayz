import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { initializeAuthListener } from '@/lib/auth'
import LandingPage from '@/pages/LandingPage'
import WelcomeScreen from '@/pages/WelcomeScreen'
import GamePage from '@/pages/GamePage'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  useEffect(() => {
    const unsubscribe = initializeAuthListener()
    return () => unsubscribe()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/welcome" 
          element={
            <ProtectedRoute>
              <WelcomeScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/game" 
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App