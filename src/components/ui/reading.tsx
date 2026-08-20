import type { ReactNode } from 'react'
import { Eyebrow } from './eyebrow'

/** Label and value on one line, for footers and dense rows. */
export function Reading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex items-baseline gap-2">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-mono text-[11px] tabular-nums text-ink-dim">{children}</span>
    </span>
  )
}
