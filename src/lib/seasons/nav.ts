import type { DayKey } from '@/lib/dates/day'
import {
  parseQuarterKey,
  quarterKey,
  quarterLabel,
  quarterRefOf,
  shiftQuarter,
  type QuarterRef,
} from './quarter'

export type SeasonNav = {
  quarter: string
  label: string
  previous: string
  next: string
  current: string
  isCurrent: boolean
}

/** Pure arithmetic — no season row needs to exist for a quarter to be navigable. */
export function seasonNav(ref: QuarterRef, today: DayKey): SeasonNav {
  const current = quarterRefOf(today)

  return {
    quarter: quarterKey(ref),
    label: quarterLabel(ref),
    previous: quarterKey(shiftQuarter(ref, -1)),
    next: quarterKey(shiftQuarter(ref, 1)),
    current: quarterKey(current),
    isCurrent: quarterKey(ref) === quarterKey(current),
  }
}

/** The nav for whichever quarter was asked for, or today's. */
export function seasonNavFor(requested: string | undefined, today: DayKey): SeasonNav {
  return seasonNav(parseQuarterKey(requested) ?? quarterRefOf(today), today)
}
