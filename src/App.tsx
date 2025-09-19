import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { initializeAuthListener } from '@/lib/auth'
import { useUserStore } from '@/store/userStore'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import LandingPage from '@/pages/LandingPage'
import WelcomeScreen from '@/pages/WelcomeScreen'
import GamePage from '@/pages/GamePage'
import AdvicePage from '@/pages/AdvicePage'
import ProtectedRoute from '@/components/ProtectedRoute'

// Component to handle conditional routing based on user progress
function ConditionalLandingRoute() {
  const { user } = useUserStore()
  const [isChecking, setIsChecking] = useState(true)
  const [hasCareerAdvice, setHasCareerAdvice] = useState(false)

  useEffect(() => {
    const checkUserProgress = async () => {
      if (!user) {
        setIsChecking(false)
        return
      }

      try {
        // Check if user has career advice (meaning they completed the assessment)
        const careerAdviceDoc = await getDoc(doc(db, 'careerAdvice', user.uid))
        setHasCareerAdvice(careerAdviceDoc.exists())
      } catch (error) {
        console.error('Error checking user progress:', error)
        setHasCareerAdvice(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkUserProgress()
  }, [user])

  if (isChecking) {
    // Show loading while checking user progress
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user has career advice, redirect to advice page
  if (hasCareerAdvice) {
    return <Navigate to="/advice" replace />
  }

  // Otherwise, show landing page
  return <LandingPage />
}

function App() {
  useEffect(() => {
    const unsubscribe = initializeAuthListener()
    return () => unsubscribe()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConditionalLandingRoute />} />
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
        <Route 
          path="/advice" 
          element={
            <ProtectedRoute>
              <AdvicePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App