import { shiftDays, shiftMonths, type DayKey } from '@/lib/dates/day'

/** A season is always one calendar quarter: Jan, Apr, Jul or Oct to its close. */
export const SEASON_MONTHS = 3

export type Quarter = 1 | 2 | 3 | 4

/** A season named the way a URL can carry it: '2026-Q3'. */
export type QuarterKey = string

const KEY_PATTERN = /^(\d{4})-Q([1-4])$/

export type QuarterRef = { year: number; quarter: Quarter }

export function quarterOfMonth(month: number): Quarter {
  return (Math.floor((month - 1) / 3) + 1) as Quarter
}

export function quarterRefOf(day: DayKey): QuarterRef {
  return { year: Number(day.slice(0, 4)), quarter: quarterOfMonth(Number(day.slice(5, 7))) }
}

/** First day of the quarter: always the 1st of January, April, July or October. */
export function quarterStart({ year, quarter }: QuarterRef): DayKey {
  const month = String((quarter - 1) * 3 + 1).padStart(2, '0')

  return `${year}-${month}-01`
}

/** Inclusive last day of the quarter. */
export function quarterEnd(ref: QuarterRef): DayKey {
  return shiftDays(shiftMonths(quarterStart(ref), SEASON_MONTHS), -1)
}

export function quarterKey({ year, quarter }: QuarterRef): QuarterKey {
  return `${year}-Q${quarter}`
}

export function quarterKeyOf(day: DayKey): QuarterKey {
  return quarterKey(quarterRefOf(day))
}

/** Reads a key back, or null when it is not one. Never throws on user input. */
export function parseQuarterKey(key: string | undefined): QuarterRef | null {
  const found = KEY_PATTERN.exec(key ?? '')

  if (!found) return null
  return { year: Number(found[1]), quarter: Number(found[2]) as Quarter }
}

/** The quarter `delta` steps away, rolling across years. */
export function shiftQuarter(ref: QuarterRef, delta: number): QuarterRef {
  const index = ref.year * 4 + (ref.quarter - 1) + delta

  return { year: Math.floor(index / 4), quarter: ((index % 4) + 1) as Quarter }
}

/** 'Q3 2026' — how a season is named in the interface. */
export function quarterLabel(ref: QuarterRef): string {
  return `Q${ref.quarter} ${ref.year}`
}

/** Guards writes: a season may not begin anywhere but a quarter boundary. */
export function isQuarterStart(day: DayKey): boolean {
  return quarterStart(quarterRefOf(day)) === day
}
