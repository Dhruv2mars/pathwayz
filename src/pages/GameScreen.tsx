import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Brain, ArrowRight, CheckCircle } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

interface GameScene {
  narrative: string
  questionType: 'multi-choice' | 'single-choice' | 'finale'
  options?: string[]
  question?: string
}

interface ConversationEntry {
  type: 'ai' | 'user'
  content: string
  timestamp: string
}

export default function GameScreen() {
  const { user } = useUserStore()
  const [isLoading, setIsLoading] = useState(true)
  const [currentScene, setCurrentScene] = useState<GameScene | null>(null)
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([])
  const [isGameFinished, setIsGameFinished] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setCurrentScene(gameData)
      setConversationHistory([{
        type: 'ai',
        content: gameData.narrative,
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
      
      // Update conversation history with AI response
      const updatedHistory = [
        ...newConversationHistory,
        {
          type: 'ai' as const,
          content: gameData.narrative,
          timestamp: new Date().toISOString()
        }
      ]

      setConversationHistory(updatedHistory)
      setCurrentScene(gameData)
      setSelectedOptions([])
      setQuestionCount(prev => prev + 1)

      if (gameData.questionType === 'finale') {
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
                      className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      View My Career Path
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