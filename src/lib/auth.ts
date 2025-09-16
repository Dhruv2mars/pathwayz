import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebaseConfig'
import { useUserStore } from '@/store/userStore'

export const initializeAuthListener = () => {
  const { setUser } = useUserStore.getState()

  return onAuthStateChanged(auth, (user) => {
    setUser(user, false)
  })
}