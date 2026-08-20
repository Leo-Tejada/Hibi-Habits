import type { CSSProperties, ReactNode } from 'react'

/** The small monospaced capital that titles every block of data. */
export function Eyebrow({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      style={style}
      className={`font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-ink-faint ${className}`}
    >
      {children}
    </span>
  )
}
