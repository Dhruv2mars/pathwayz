import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'

interface SkillAnalysis {
  brief: string
  totalSkills: string[]
  skillGap: string[]
}

interface SkillAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  pathTitle: string
  skillAnalysis: SkillAnalysis | null
  isLoading: boolean
  error: string | null
}

export function SkillAnalysisModal({
  isOpen,
  onClose,
  pathTitle,
  skillAnalysis,
  isLoading,
  error
}: SkillAnalysisModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl max-h-[95vh] mx-4 overflow-hidden"
        >
          <Card className="bg-gradient-to-br from-slate-50 via-white to-slate-100 border-slate-200 shadow-xl">
            {/* Header with Close Button */}
            <CardHeader className="pb-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-slate-600">
                      Skill Analysis
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-light text-slate-900 pr-8">
                    {pathTitle}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="max-h-[80vh] overflow-y-auto space-y-6 px-6 pb-6">
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full mb-4"
                  />
                  <p className="text-slate-600">Analyzing skill requirements...</p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900 mb-2">Analysis Failed</h3>
                  <p className="text-slate-600 text-center max-w-md">{error}</p>
                  <Button onClick={onClose} className="mt-4" variant="outline">
                    Close
                  </Button>
                </motion.div>
              )}

              {skillAnalysis && !isLoading && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6"
                >
                  {/* Path Brief */}
                  <div>
                    <div className="flex items-center mb-4">
                      <Target className="w-5 h-5 text-slate-600 mr-2" />
                      <h3 className="text-lg font-medium text-slate-900">Career Path Overview</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border">
                      {skillAnalysis.brief}
                    </p>
                  </div>

                  {/* Total Skills Required */}
                  <div>
                    <div className="flex items-center mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="text-lg font-medium text-slate-900">Essential Skills Required</h3>
                      <Badge variant="secondary" className="ml-2">
                        {skillAnalysis.totalSkills.length} skills
                      </Badge>
                    </div>
                    <div className="grid gap-3">
                      {skillAnalysis.totalSkills.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                          className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-slate-700 font-medium">{skill}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Skill Gap Analysis */}
                  <div>
                    <div className="flex items-center mb-4">
                      <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                      <h3 className="text-lg font-medium text-slate-900">Your Priority Skill Gaps</h3>
                      <Badge variant="outline" className="ml-2 text-orange-600 border-orange-200">
                        Focus Areas
                      </Badge>
                    </div>
                    <div className="grid gap-4">
                      {skillAnalysis.skillGap.map((gap, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                              !
                            </div>
                            <div className="flex-1">
                              <p className="text-slate-700 leading-relaxed">{gap}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="bg-slate-50 p-6 rounded-lg">
                      <h4 className="text-lg font-medium text-slate-900 mb-3">Ready to Bridge the Gap?</h4>
                      <p className="text-slate-600 mb-4">
                        These personalized insights show exactly where to focus your learning efforts 
                        for maximum career impact.
                      </p>
                      <div className="flex space-x-3">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                          Start Learning
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                          Close Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}