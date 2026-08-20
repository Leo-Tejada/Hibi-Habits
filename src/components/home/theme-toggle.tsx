'use client'

import { useSyncExternalStore } from 'react'
import { applyTheme, readTheme, subscribeTheme, THEMES, type Theme } from '@/lib/theme'

/**
 * The stored choice only exists on the client, so the server snapshot is
 * null and nothing is marked active until the browser has read it. That
 * keeps the first paint honest instead of guessing and correcting.
 */
function useTheme(): Theme | null {
  return useSyncExternalStore<Theme | null>(subscribeTheme, readTheme, () => null)
}

export function ThemeToggle() {
  const choice = useTheme()

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="flex items-center rounded-full border border-line bg-panel p-0.5"
    >
      {THEMES.map((theme) => (
        <button
          key={theme.value}
          type="button"
          onClick={() => applyTheme(theme.value)}
          aria-pressed={choice === theme.value}
          className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
            choice === theme.value ? 'bg-ink text-ground' : 'text-ink-faint hover:text-ink-dim'
          }`}
        >
          {theme.label}
        </button>
      ))}
    </div>
  )
}
