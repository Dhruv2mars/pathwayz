import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkillAnalysisModal } from '@/components/ui/skill-analysis-modal'
import { ArrowLeft, Compass, Target, Star, TrendingUp, AlertCircle } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
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

interface SkillAnalysis {
  brief: string
  totalSkills: string[]
  skillGap: string[]
}

interface UserProfile {
  coreMotivators: string[]
  problemSolvingStyle: string
  preferredWorkEnvironment: string
  keyAptitudes: string[]
  interestsAndPassions: string[]
  personalitySummary: string
}

interface SkillAnalysisCache {
  [pathTitle: string]: SkillAnalysis & {
    createdAt: string
  }
}

export default function AdvicePage() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Skill analysis modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null)
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null)
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [skillAnalysisCache, setSkillAnalysisCache] = useState<SkillAnalysisCache>({})

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    fetchCareerAdvice()
    fetchUserProfile()
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

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for user:', user?.uid)

      const userProfileDoc = await getDoc(doc(db, 'users', user!.uid))
      
      if (userProfileDoc.exists()) {
        const data = userProfileDoc.data()
        console.log('User profile found:', data)
        setUserProfile({
          coreMotivators: data.coreMotivators,
          problemSolvingStyle: data.problemSolvingStyle,
          preferredWorkEnvironment: data.preferredWorkEnvironment,
          keyAptitudes: data.keyAptitudes,
          interestsAndPassions: data.interestsAndPassions,
          personalitySummary: data.personalitySummary
        })
      } else {
        console.log('No user profile found for user')
        setError('User profile not found. Please complete the assessment first.')
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError('Failed to load user profile. Please try again.')
    }
  }

  const handleRetry = () => {
    fetchCareerAdvice()
  }

  const handleBackToGame = () => {
    navigate('/')
  }

  const checkSkillAnalysisCache = async (pathTitle: string): Promise<SkillAnalysis | null> => {
    try {
      // First check local cache
      if (skillAnalysisCache[pathTitle]) {
        console.log('Found skill analysis in local cache for:', pathTitle)
        return skillAnalysisCache[pathTitle]
      }

      // Check Firestore cache
      const skillAnalysisDoc = await getDoc(doc(db, 'skillAnalysis', user!.uid))
      if (skillAnalysisDoc.exists()) {
        const data = skillAnalysisDoc.data()
        if (data[pathTitle]) {
          console.log('Found skill analysis in Firestore cache for:', pathTitle)
          const cachedAnalysis = data[pathTitle]
          
          // Update local cache
          setSkillAnalysisCache(prev => ({
            ...prev,
            [pathTitle]: cachedAnalysis
          }))
          
          return {
            brief: cachedAnalysis.brief,
            totalSkills: cachedAnalysis.totalSkills,
            skillGap: cachedAnalysis.skillGap
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error checking skill analysis cache:', error)
      return null
    }
  }

  const generateSkillAnalysis = async (careerPath: CareerPath): Promise<SkillAnalysis> => {
    try {
      if (!userProfile) {
        throw new Error('User profile not loaded')
      }
      
      console.log('Calling skill analysis API for path:', careerPath.title)
      
      const response = await fetch('/api/generateSkillAnalysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: userProfile,
          careerPath: careerPath
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to generate skill analysis')
      }

      const skillAnalysisData = await response.json()
      console.log('Skill analysis generated successfully:', skillAnalysisData)
      
      // Save to Firestore (client-side)
      try {
        const skillAnalysisRef = doc(db, 'skillAnalysis', user!.uid)
        const skillAnalysisWithTimestamp = {
          ...skillAnalysisData,
          createdAt: new Date().toISOString()
        }
        
        // Get existing document to merge data
        const existingDoc = await getDoc(skillAnalysisRef)
        const existingData = existingDoc.exists() ? existingDoc.data() : {}
        
        // Update/create document with new path analysis
        await setDoc(skillAnalysisRef, {
          ...existingData,
          [careerPath.title]: skillAnalysisWithTimestamp
        })
        
        console.log('Skill analysis saved to Firestore for path:', careerPath.title)
      } catch (saveError) {
        console.error('Error saving skill analysis to Firestore:', saveError)
        // Don't throw - we still want to return the data even if save fails
      }
      
      // Update local cache
      setSkillAnalysisCache(prev => ({
        ...prev,
        [careerPath.title]: {
          ...skillAnalysisData,
          createdAt: new Date().toISOString()
        }
      }))
      
      return skillAnalysisData
    } catch (error) {
      console.error('Error generating skill analysis:', error)
      throw error
    }
  }

  const handlePathClick = async (path: CareerPath) => {
    setSelectedPath(path)
    setIsModalOpen(true)
    setSkillAnalysis(null)
    setAnalysisError(null)
    setIsAnalysisLoading(true)

    try {
      // Check cache first
      const cachedAnalysis = await checkSkillAnalysisCache(path.title)
      
      if (cachedAnalysis) {
        setSkillAnalysis(cachedAnalysis)
        setIsAnalysisLoading(false)
      } else {
        // Generate new analysis
        const newAnalysis = await generateSkillAnalysis(path)
        setSkillAnalysis(newAnalysis)
        setIsAnalysisLoading(false)
      }
    } catch (error) {
      console.error('Error handling path click:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze skills')
      setIsAnalysisLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPath(null)
    setSkillAnalysis(null)
    setAnalysisError(null)
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
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer hover:bg-slate-50"
                    onClick={() => handlePathClick(path)}
                  >
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
      
      {/* Skill Analysis Modal */}
      <SkillAnalysisModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pathTitle={selectedPath?.title || ''}
        skillAnalysis={skillAnalysis}
        isLoading={isAnalysisLoading}
        error={analysisError}
      />
    </div>
  )
}