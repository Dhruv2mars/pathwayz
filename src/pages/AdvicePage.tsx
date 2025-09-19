import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Compass, Target, Star, TrendingUp, AlertCircle } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

interface CareerPath {
  title: string
  description: string
}

interface CareerAdvice {
  direction: string
  paths: CareerPath[]
  createdAt?: string
}

export default function AdvicePage() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    fetchCareerAdvice()
  }, [user, navigate])

  const fetchCareerAdvice = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Fetching career advice for user:', user?.uid)

      const careerAdviceDoc = await getDoc(doc(db, 'careerAdvice', user!.uid))
      
      if (careerAdviceDoc.exists()) {
        const data = careerAdviceDoc.data()
        console.log('Career advice found:', data)
        setCareerAdvice({
          direction: data.direction,
          paths: data.paths,
          createdAt: data.createdAt
        })
      } else {
        console.log('No career advice found for user')
        setError('No career advice found. Please complete the assessment first.')
      }
    } catch (err) {
      console.error('Error fetching career advice:', err)
      setError('Failed to load career advice. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    fetchCareerAdvice()
  }

  const handleBackToGame = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full mx-auto mb-6"
          />
          <h2 className="text-2xl font-light text-slate-900 mb-3">Loading Your Career Paths</h2>
          <p className="text-slate-600">Retrieving your personalized career advice...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-light text-slate-900 mb-3">Something went wrong</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={handleRetry} className="bg-slate-900 hover:bg-slate-800 text-white">
              Try Again
            </Button>
            <Button onClick={handleBackToGame} variant="outline">
              Back to Assessment
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!careerAdvice) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-green-100/20 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            onClick={handleBackToGame}
            variant="ghost"
            className="flex items-center text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessment
          </Button>
          <Badge variant="outline" className="text-slate-600">
            Generated on {careerAdvice.createdAt ? new Date(careerAdvice.createdAt).toLocaleDateString() : 'Today'}
          </Badge>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Direction Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-light text-slate-900 mb-4">Your Career Direction</h1>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              {careerAdvice.direction}
            </p>
          </motion.div>

          {/* Career Paths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <Target className="w-6 h-6 text-slate-600 mr-3" />
                <h2 className="text-2xl font-light text-slate-900">Future-Focused Career Paths</h2>
              </div>
            </div>

            <div className="grid gap-6">
              {careerAdvice.paths.map((path, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-slate-900 mb-2 flex items-center">
                            <Star className="w-5 h-5 text-yellow-500 mr-2" />
                            {path.title}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            Path #{index + 1}
                          </Badge>
                        </div>
                        <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0 ml-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 leading-relaxed">
                        {path.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="py-8">
                <h3 className="text-2xl font-light text-slate-900 mb-4">Ready to Take the Next Step?</h3>
                <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                  These career paths are tailored specifically for you based on your personality, skills, and interests. 
                  Start exploring these opportunities and building the skills needed for your future success.
                </p>
                <div className="space-x-4">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3">
                    Explore Resources
                  </Button>
                  <Button variant="outline" onClick={handleBackToGame}>
                    Retake Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}