import { create } from 'zustand'

interface CreditsState {
  credits: number
  spendCredits: (amount: number) => boolean
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  credits: 50,
  spendCredits: (amount: number) => {
    const current = get().credits
    if (current < amount) return false
    set({ credits: current - amount })
    return true
  },
}))
