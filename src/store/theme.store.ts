import { create } from 'zustand'

function getAutoMode(): 'light' | 'dark' {
  const h = new Date().getHours()
  return h >= 6 && h < 18 ? 'light' : 'dark'
}

interface ThemeState {
  mode: 'light' | 'dark'
  override: 'light' | 'dark' | null
  setOverride: (override: 'light' | 'dark' | null) => void
  toggleMode: () => void
  isDark: boolean
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const saved = localStorage.getItem('theme-override') as 'light' | 'dark' | null
  const auto = getAutoMode()
  const mode = saved ?? auto

  return {
    mode,
    override: saved,
    isDark: mode === 'dark',
    setOverride: (override) => {
      if (override) {
        localStorage.setItem('theme-override', override)
      } else {
        localStorage.removeItem('theme-override')
      }
      const newMode = override ?? getAutoMode()
      set({ override, mode: newMode, isDark: newMode === 'dark' })
      applyTheme(newMode)
    },
    toggleMode: () => {
      const current = get().mode
      const next = current === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme-override', next)
      set({ override: next, mode: next, isDark: next === 'dark' })
      applyTheme(next)
    },
  }
})

function applyTheme(mode: 'light' | 'dark') {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Apply on load
applyTheme(useThemeStore.getState().mode)
