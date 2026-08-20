import Link from 'next/link'
import { quarterLabel, parseQuarterKey, type QuarterKey } from '@/lib/seasons/quarter'
import type { SeasonNav } from '@/types/home'

function labelOf(key: QuarterKey): string {
  const ref = parseQuarterKey(key)

  return ref ? quarterLabel(ref) : key
}

function Step({ to, glyph }: { to: QuarterKey; glyph: string }) {
  return (
    <Link
      href={`/?season=${to}`}
      aria-label={`Go to ${labelOf(to)}`}
      className="rounded-full px-2.5 py-1 text-[13px] leading-none text-ink-faint hover:text-ink"
    >
      {glyph}
    </Link>
  )
}

/**
 * Seasons are calendar quarters, so moving between them is arithmetic and
 * every quarter is reachable — including the one that closed a minute ago
 * while you were still writing it up.
 */
export function SeasonSwitcher({ nav }: { nav: SeasonNav }) {
  return (
    <div className="flex items-center gap-2">
      {!nav.isCurrent && (
        <Link
          href={`/?season=${nav.current}`}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint hover:text-ink"
        >
          Now
        </Link>
      )}
      <nav
        aria-label="Season"
        className="flex items-center rounded-full border border-line bg-panel p-0.5"
      >
        <Step to={nav.previous} glyph="‹" />
        <span className="min-w-[4.5rem] px-1 text-center font-mono text-[11px] tabular-nums tracking-[0.08em]">
          {nav.label}
        </span>
        <Step to={nav.next} glyph="›" />
      </nav>
    </div>
  )
}
