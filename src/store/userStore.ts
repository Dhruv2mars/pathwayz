import { create } from 'zustand'
import { User } from 'firebase/auth'

interface UserState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null, isLoading?: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user, isLoading = false) => set({ user, isLoading }),
}))