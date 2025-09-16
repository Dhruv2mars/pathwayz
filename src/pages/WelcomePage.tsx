import { useUserStore } from '@/store/userStore'
import { logout } from '@/lib/authFunctions'
import { motion } from 'framer-motion'

export default function WelcomePage() {
  const { user } = useUserStore()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-light text-gray-900 mb-6">
          Welcome, {user?.displayName || user?.email}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your personalized career journey starts here.
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </motion.div>
  )
}