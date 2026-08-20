import type { ReactNode } from 'react'
import { Eyebrow } from './eyebrow'

export function Panel({
  title,
  aside,
  padded = true,
  children,
  className = '',
}: {
  title: string
  aside?: ReactNode
  padded?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`border border-line bg-panel ${className}`}>
      <header className="flex items-center justify-between border-b border-line-soft px-4 py-2.5">
        <Eyebrow>{title}</Eyebrow>
        {aside}
      </header>
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  )
}
