import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Brain, ArrowRight, CheckCircle } from 'lucide-react'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

interface GameScene {
  narrative: string
  questionType: 'multi-choice' | 'single-choice' | 'finale'
  options?: string[]
  question?: string
}

interface AIResponse {
  narrative: string
  questionType: 'multi-choice' | 'single-choice' | 'finale'
  options?: string[]
}

interface ConversationEntry {
  type: 'ai' | 'user'
  content: AIResponse | string  // AI responses contain full response object, user responses are selected option text
  timestamp: string
  selectedOptions?: string[]    // For user entries, store the actual options they selected
}

export default function GameScreen() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [currentScene, setCurrentScene] = useState<GameScene | null>(null)
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([])
  const [isGameFinished, setIsGameFinished] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingResults, setIsSavingResults] = useState(false)
  const [isGeneratingCareerAdvice, setIsGeneratingCareerAdvice] = useState(false)

  // Initialize game on component mount
  useEffect(() => {
    startGame()
  }, [])

  const startGame = async () => {
    setIsLoading(true)
    try {
      // Fetch user data from Firestore
      let userData = null
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          userData = userDoc.data()
        }
      }

      const response = await fetch('/api/startGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userUid: user?.uid,
          userData: userData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start game')
      }

      const gameData = await response.json()
      
      // Ensure options are strings, not objects
      const processedGameData = {
        ...gameData,
        options: gameData.options?.map((opt: any) => typeof opt === 'string' ? opt : opt.text) || []
      }
      
      setCurrentScene(processedGameData)
      setConversationHistory([{
        type: 'ai',
        content: {
          narrative: processedGameData.narrative,
          questionType: processedGameData.questionType,
          options: processedGameData.options || []
        },
        timestamp: new Date().toISOString()
      }])
      setQuestionCount(1)
    } catch (error) {
      console.error('Error starting game:', error)
      // Fallback for development
      setCurrentScene({
        narrative: "Welcome to your career discovery journey! I'm your AI guide, and I'm excited to help you explore your potential. Let's start with understanding your interests.",
        questionType: 'multi-choice',
        question: "Which of these activities do you find most engaging?",
        options: [
          'Solving complex puzzles and problems',
          'Creating art, music, or written content', 
          'Working with people and building relationships',
          'Understanding how things work mechanically'
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const continueGame = async () => {
    if (selectedOptions.length === 0) return

    setIsSubmitting(true)
    const userResponse = selectedOptions
      .map(optionId => currentScene?.options?.[parseInt(optionId)])
      .filter(Boolean)
      .join(', ')
    
    // Add user response to conversation history
    const newConversationHistory = [
      ...conversationHistory,
      {
        type: 'user' as const,
        content: userResponse,
        selectedOptions: selectedOptions.map(optionId => currentScene?.options?.[parseInt(optionId)]).filter(Boolean),
        timestamp: new Date().toISOString()
      }
    ]

    try {
      const response = await fetch('/api/continueGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: newConversationHistory,
          userUid: user?.uid,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to continue game')
      }

      const gameData = await response.json()
      
      // Ensure options are strings, not objects
      const processedGameData = {
        ...gameData,
        options: gameData.options?.map((opt: any) => typeof opt === 'string' ? opt : opt.text) || []
      }
      
      // Update conversation history with AI response
      const updatedHistory = [
        ...newConversationHistory,
        {
          type: 'ai' as const,
          content: {
            narrative: processedGameData.narrative,
            questionType: processedGameData.questionType,
            options: processedGameData.options || []
          },
          timestamp: new Date().toISOString()
        }
      ]

      setConversationHistory(updatedHistory)
      setCurrentScene(processedGameData)
      setSelectedOptions([])
      setQuestionCount(prev => prev + 1)

      if (processedGameData.questionType === 'finale') {
        setIsGameFinished(true)
      }
    } catch (error) {
      console.error('Error continuing game:', error)
      // Fallback for development
      setCurrentScene({
        narrative: "Thank you for completing the assessment! Based on your responses, you have a strong analytical mindset with creative problem-solving abilities.",
        questionType: 'finale'
      })
      setIsGameFinished(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOptionToggle = (optionId: string) => {
    if (currentScene?.questionType === 'single-choice') {
      setSelectedOptions([optionId])
    } else {
      setSelectedOptions(prev => 
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    }
  }

  const generateUserProfile = async (userUid: string, conversationHistory: any[]) => {
    try {
      console.log('Starting profile generation for user:', userUid)
      
      // Call the profile generation API
      const response = await fetch('/api/generateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userUid,
          conversationHistory
        }),
      })

      if (!response.ok) {
        throw new Error(`Profile API error: ${response.status}`)
      }

      const profileData = await response.json()
      console.log('Profile generated by API:', profileData)

      // Save profile to userProfiles collection
      const profileDocument = {
        userUid,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        gameVersion: '1.0',
        profile: profileData
      }

      await setDoc(doc(db, 'userProfiles', userUid), profileDocument)
      console.log('Profile saved to database successfully')
      
      return profileData
    } catch (error) {
      console.error('Error in generateUserProfile:', error)
      throw error
    }
  }

  const generateCareerAdvice = async (userUid: string, userProfile: any) => {
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        attempts++
        console.log(`Starting career advice generation for user: ${userUid} (attempt ${attempts}/${maxAttempts})`)
        
        // Call the career advice generation API
        const response = await fetch('/api/generateCareerAdvice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userUid,
            userProfile
          }),
        })

        if (!response.ok) {
          throw new Error(`Career advice API error: ${response.status}`)
        }

        const careerAdviceData = await response.json()
        console.log('Career advice generated by API:', careerAdviceData)
        
        // Save career advice to Firestore
        const careerAdviceDocument = {
          userUid,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          direction: careerAdviceData.direction,
          paths: careerAdviceData.paths
        }

        await setDoc(doc(db, 'careerAdvice', userUid), careerAdviceDocument)
        console.log('Career advice saved to database successfully')
        
        return careerAdviceData
      } catch (error) {
        console.error(`Career advice generation attempt ${attempts} failed:`, error)
        
        if (attempts < maxAttempts) {
          console.log(`Retrying career advice generation in 2 seconds...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          console.error('All career advice generation attempts failed')
          throw error
        }
      }
    }
  }

  const handleViewResults = async () => {
    setIsSavingResults(true)
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated')
      }

      // Count AI questions and user responses
      const aiQuestions = conversationHistory.filter(entry => entry.type === 'ai').length
      const userResponses = conversationHistory.filter(entry => entry.type === 'user').length

      // Create transcript document
      const transcript = {
        userUid: user.uid,
        completedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        conversationHistory,
        metadata: {
          totalQuestions: aiQuestions,
          gameVersion: '1.0',
          totalResponses: userResponses
        }
      }

      // Save transcript and generate profile in parallel
      const transcriptPromise = setDoc(doc(db, 'gameTranscripts', user.uid), transcript)
      const profilePromise = generateUserProfile(user.uid, conversationHistory)
      
      // Wait for transcript to save (critical)
      await transcriptPromise
      console.log('Transcript saved successfully for user:', user.uid)
      
      // Handle profile generation (non-critical)
      try {
        const profileData = await profilePromise
        console.log('User profile generated and saved successfully')
        
        // Generate career advice after profile is completed
        setIsGeneratingCareerAdvice(true)
        try {
          await generateCareerAdvice(user.uid, profileData)
          console.log('Career advice generated and saved successfully')
          
          // Navigate to advice page
          navigate('/advice')
        } catch (careerAdviceError) {
          console.error('Career advice generation failed:', careerAdviceError)
          alert('Your career assessment has been completed and saved successfully! (Note: There was an issue generating career advice, but your profile is saved)')
        } finally {
          setIsGeneratingCareerAdvice(false)
        }
      } catch (profileError) {
        console.error('Profile generation failed (transcript still saved):', profileError)
        alert('Your assessment is complete! (Note: There was an issue saving the profile, but your transcript is saved)')
      }
      
    } catch (error) {
      console.error('Error saving transcript:', error)
      // Show error but still allow user to continue
      alert('Your assessment is complete! (Note: There was an issue saving the transcript, but your results are still available)')
    } finally {
      setIsSavingResults(false)
    }
  }

  const progress = Math.min((questionCount / 10) * 100, 100) // Assuming ~10 questions

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
          <h2 className="text-2xl font-light text-slate-900 mb-3">Preparing Your Assessment</h2>
          <p className="text-slate-600">Our AI is creating a personalized experience just for you...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mix-blend-multiply opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mix-blend-multiply opacity-30"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700">
                <Brain className="w-3 h-3 mr-1" />
                Career Assessment
              </Badge>
              <span className="text-sm text-slate-600">Question {questionCount}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600">{Math.round(progress)}% Complete</span>
              <div className="w-32">
                <Progress value={progress} className="h-2 bg-slate-100" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div
            key={currentScene?.narrative}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-4xl mx-auto"
          >
            {/* AI Narrative Card */}
            <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-lg font-medium text-slate-800">Your AI Guide</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-slate-700 text-lg leading-relaxed"
                >
                  {currentScene?.narrative}
                </motion.p>
                {currentScene?.question && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <p className="font-medium text-slate-800">{currentScene.question}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Options or Final Action */}
            <AnimatePresence mode="wait">
              {!isGameFinished && currentScene?.options ? (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Options Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {currentScene.options.map((option, index) => {
                      const optionId = index.toString()
                      return (
                        <motion.div
                          key={optionId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedOptions.includes(optionId)
                              ? 'border-slate-400 bg-slate-50'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                          onClick={() => handleOptionToggle(optionId)}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedOptions.includes(optionId)}
                              onChange={() => handleOptionToggle(optionId)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="text-slate-800 font-medium">{option}</p>
                            </div>
                            {selectedOptions.includes(optionId) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.3 }}
                              >
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Next Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex justify-center pt-6"
                  >
                    <Button
                      onClick={continueGame}
                      disabled={selectedOptions.length === 0 || isSubmitting}
                      className="group px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      <AnimatePresence mode="wait">
                        {isSubmitting ? (
                          <motion.div
                            key="submitting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                            />
                            Processing...
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center"
                          >
                            Continue
                            <motion.div
                              className="ml-2 group-hover:translate-x-1 transition-transform duration-200"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </motion.div>
              ) : isGameFinished ? (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm p-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.6 }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-light text-slate-900 mb-4">Assessment Complete!</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Great job! Your career pathway is being generated based on your responses.
                    </p>
                    <Button
                      onClick={handleViewResults}
                      disabled={isSavingResults || isGeneratingCareerAdvice}
                      className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
                    >
                      <AnimatePresence mode="wait">
                        {isSavingResults ? (
                          <motion.div
                            key="saving"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                            />
                            Saving Results...
                          </motion.div>
                        ) : isGeneratingCareerAdvice ? (
                          <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                            />
                            Generating Career Paths...
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            View My Career Path
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </Card>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}