import { FiSun, FiMoon } from 'react-icons/fi'
import { useThemeStore } from '../store/theme.store'

export default function ThemeSwitch() {
  const { isDark, toggleMode } = useThemeStore()

  return (
    <button
      onClick={toggleMode}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className="relative flex items-center w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer"
      style={{
        backgroundColor: isDark ? '#1e293b' : '#bae6fd',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
      }}
    >
      {/* Track icons */}
      <FiSun
        size={12}
        className="absolute left-1.5 transition-opacity duration-300"
        style={{ color: '#f59e0b', opacity: isDark ? 0.3 : 0 }}
      />
      <FiMoon
        size={12}
        className="absolute right-1.5 transition-opacity duration-300"
        style={{ color: '#94a3b8', opacity: isDark ? 0 : 0.3 }}
      />

      {/* Thumb */}
      <span
        className="absolute flex items-center justify-center w-5 h-5 rounded-full shadow-md transition-all duration-300"
        style={{
          left: isDark ? 'calc(100% - 24px)' : '3px',
          backgroundColor: isDark ? '#334155' : '#ffffff',
        }}
      >
        {isDark ? (
          <FiMoon size={11} style={{ color: '#e2e8f0' }} />
        ) : (
          <FiSun size={11} style={{ color: '#f59e0b' }} />
        )}
      </span>
    </button>
  )
}
