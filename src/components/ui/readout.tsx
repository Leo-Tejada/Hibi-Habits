import type { ReactNode } from 'react'
import { Eyebrow } from './eyebrow'

/** Label above a figure, for numbers meant to be read at a glance. */
export function Readout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-mono text-[19px] leading-none tabular-nums">{children}</span>
    </div>
  )
}
