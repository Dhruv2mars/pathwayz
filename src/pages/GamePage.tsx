import { motion } from 'framer-motion'

export default function GamePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-light text-gray-900 mb-6">
          Career Quiz
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Coming soon - Your personalized career assessment.
        </p>
      </div>
    </motion.div>
  )
}