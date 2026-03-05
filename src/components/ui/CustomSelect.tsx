import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronDown, FiCheck } from 'react-icons/fi'

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  })

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder

  // Calculate dropdown position when opening
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownHeight = 220 // max-h-52 ≈ 208px + border
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    setPos({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    })
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  // Close on scroll of any parent (reposition would be janky), but ignore scroll inside dropdown
  useEffect(() => {
    if (!open) return
    const handleScroll = (e: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [open])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <div className={className}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border rounded-lg transition-colors
          ${open
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-border hover:border-primary/50'
          }
          ${value ? 'text-text' : 'text-text-muted'}
          bg-surface-alt
        `}
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <FiChevronDown
          size={14}
          className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown via portal — escapes overflow:hidden parents */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl overflow-hidden"
            style={{
              top: pos.openUp ? undefined : pos.top,
              bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
              left: pos.left,
              width: pos.width,
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div
              className="max-h-52 overflow-y-auto custom-scrollbar"
              style={{ overscrollBehavior: 'contain' }}
            >
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors
                      ${isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text hover:bg-surface-alt'
                      }
                    `}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <FiCheck size={12} className="shrink-0 text-primary" />}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
