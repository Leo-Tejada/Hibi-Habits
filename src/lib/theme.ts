export const THEME_STORAGE_KEY = 'hibi-theme'

export type Theme = 'system' | 'light' | 'dark'

export const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function isTheme(value: string | null): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)

    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

const listeners = new Set<() => void>()

/**
 * The stored theme is external state, so components read it through
 * `useSyncExternalStore` rather than mirroring it. Listening to `storage`
 * as well means changing the theme in one tab settles the others.
 */
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/**
 * An explicit choice is stamped on the root element; "system" removes the
 * stamp and lets the media query decide again. See `globals.css`.
 */
export function applyTheme(theme: Theme): void {
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // A blocked storage API is not a reason to refuse to change theme.
  }

  for (const listener of listeners) listener()
}

/**
 * Runs before the first paint so a chosen theme never flashes the other
 * one. Kept beside `applyTheme` so the two cannot drift apart.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}})()`

export type ResolvedTheme = 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * The theme actually on screen. An explicit choice wins; "system" defers to
 * the browser. Anything that has to *match* the palette rather than report
 * the setting needs this, because "system" is not a colour.
 */
export function readResolvedTheme(): ResolvedTheme {
  const choice = readTheme()

  if (choice !== 'system') return choice
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/** Either half can move it, so both are listened to. */
export function subscribeResolvedTheme(listener: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY)
  const unsubscribe = subscribeTheme(listener)

  query.addEventListener('change', listener)

  return () => {
    unsubscribe()
    query.removeEventListener('change', listener)
  }
}
