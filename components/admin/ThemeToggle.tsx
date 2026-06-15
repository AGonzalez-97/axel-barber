'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Apariencia</p>
        <p className="text-xs text-gray-400">{isDark ? 'Modo oscuro activo' : 'Modo claro activo'}</p>
      </div>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        role="switch"
        aria-checked={isDark}
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
          isDark ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-600',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
            isDark ? 'left-[26px]' : 'left-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
