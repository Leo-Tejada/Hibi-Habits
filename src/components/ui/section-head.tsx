import { Eyebrow } from './eyebrow'

/** Titles a run of cards, as opposed to `Panel`, which boxes one. */
export function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-3 border-b border-line-soft pb-2">
      <Eyebrow className="text-ink-dim">{title}</Eyebrow>
      {note && <span className="text-[11px] text-ink-faint">{note}</span>}
    </div>
  )
}
