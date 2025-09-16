import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { User, MapPin, GraduationCap, Globe, Calendar, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'

export default function WelcomeScreen() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [completedFields, setCompletedFields] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    age: '',
    gender: '',
    academicStatus: '',
    place: '',
    language: 'English'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        email: user.email,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true })

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      navigate('/game')
    } catch (error) {
      console.error('Error saving user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Track completed fields
    if (value && !completedFields.includes(field)) {
      setCompletedFields(prev => [...prev, field])
    } else if (!value && completedFields.includes(field)) {
      setCompletedFields(prev => prev.filter(f => f !== field))
    }
  }

  const progress = (completedFields.length / 6) * 100
  const isFormValid = Object.values(formData).every(value => value.trim() !== '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mix-blend-multiply opacity-40"
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
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mix-blend-multiply opacity-40"
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

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <Badge variant="secondary" className="mb-4 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Step 1 of 2
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extralight text-slate-900 mb-3 tracking-tight">
              Tell us about yourself
            </h1>
            <p className="text-lg text-slate-600 font-light">
              Help us personalize your career discovery journey
            </p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Profile completion</span>
              <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-100" />
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Name field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-slate-600" />
                      <Label htmlFor="name" className="text-base font-medium text-slate-800">
                        Full Name
                      </Label>
                      {completedFields.includes('name') && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="h-12 text-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      placeholder="Enter your full name"
                      required
                    />
                  </motion.div>

                  {/* Age field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-slate-600" />
                      <Label htmlFor="age" className="text-base font-medium text-slate-800">
                        Age
                      </Label>
                      {completedFields.includes('age') && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="h-12 text-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      placeholder="Your age"
                      min="13"
                      max="100"
                      required
                    />
                  </motion.div>

                  {/* Gender field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-slate-600" />
                      <Label htmlFor="gender" className="text-base font-medium text-slate-800">
                        Gender
                      </Label>
                      {completedFields.includes('gender') && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Select onValueChange={(value) => handleInputChange('gender', value)} required>
                      <SelectTrigger className="h-12 text-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Academic Status field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5 text-slate-600" />
                      <Label htmlFor="academicStatus" className="text-base font-medium text-slate-800">
                        Current Academic Status
                      </Label>
                      {completedFields.includes('academicStatus') && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Input
                      id="academicStatus"
                      type="text"
                      value={formData.academicStatus}
                      onChange={(e) => handleInputChange('academicStatus', e.target.value)}
                      placeholder="e.g., Class 12, Science"
                      className="h-12 text-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </motion.div>

                  {/* Place field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-slate-600" />
                      <Label htmlFor="place" className="text-base font-medium text-slate-800">
                        Location
                      </Label>
                      {completedFields.includes('place') && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Input
                      id="place"
                      type="text"
                      value={formData.place}
                      onChange={(e) => handleInputChange('place', e.target.value)}
                      placeholder="e.g., Faridabad, Delhi"
                      className="h-12 text-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </motion.div>

                  {/* Language field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-slate-600" />
                      <Label htmlFor="language" className="text-base font-medium text-slate-800">
                        Preferred Language
                      </Label>
                      {completedFields.includes('language') && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Select 
                      defaultValue="English" 
                      onValueChange={(value) => handleInputChange('language', value)}
                    >
                      <SelectTrigger className="h-12 text-lg border-slate-200 focus:border-slate-400 focus:ring-slate-400">
                        <SelectValue placeholder="Select your preferred language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                    className="pt-6"
                  >
                    <Button
                      type="submit"
                      disabled={isLoading || !isFormValid}
                      className="group w-full h-14 bg-slate-900 hover:bg-slate-800 text-white text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
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
                            Building your pathway...
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center"
                          >
                            Build My Pathway
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
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}