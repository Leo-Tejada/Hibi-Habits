'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(QUERY)

  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

function read(): boolean {
  return window.matchMedia(QUERY).matches
}

/**
 * Whether this person has asked their system for less movement.
 *
 * Assumes stillness until the browser says otherwise, so nothing starts
 * moving during the server-rendered frame and then has to stop. Two
 * things read it: the background gradient, which holds its pose, and the
 * habits graph, which settles instantly instead of drifting into place.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => true)
}
