import type { ReactNode } from 'react'

/** A number meant to be read down a column: monospaced and tabular. */
export function Figure({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono tabular-nums ${className}`}>{children}</span>
}
