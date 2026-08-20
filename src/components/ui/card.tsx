import type { ReactNode } from 'react'

/**
 * A card floats; a panel sits in the layout.
 *
 * Panels are the flat, hairline surfaces the dashboard is built from.
 * A card is the other material in this app: rounded, lifted a little off
 * the ground, and meant to be the only thing on the screen worth looking
 * at. Keep the distinction — if it belongs in a grid, it is a panel.
 */
export function Card({
  children,
  className = '',
  ...rest
}: {
  children: ReactNode
  className?: string
} & Omit<React.ComponentPropsWithoutRef<'section'>, 'className' | 'children'>) {
  return (
    <section
      className={`rounded-xl border border-line bg-panel shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.28)] ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}
