import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, _password: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (email: string) => {
    set({
      user: {
        id: '1',
        name: email.split('@')[0],
        email,
      },
      isAuthenticated: true,
    })
  },
  logout: () => {
    set({ user: null, isAuthenticated: false })
  },
}))
