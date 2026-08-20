import { toDateColumn, type DayKey } from './day'

const UTC = { timeZone: 'UTC' } as const

function partsOf(day: DayKey, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', { ...UTC, ...options }).format(toDateColumn(day))
}

/** "Thu 20 Aug 2026" — the full date line. */
export function longDate(day: DayKey): string {
  return partsOf(day, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/** "20 Aug" — for compact rows. */
export function shortDate(day: DayKey): string {
  return partsOf(day, { day: 'numeric', month: 'short' })
}

/** "Aug" — for the season ruler. Always three letters, so columns line up. */
export function monthLabel(day: DayKey): string {
  return partsOf(day, { month: 'short' }).slice(0, 3)
}

/** "Yesterday", "3 days ago" — for anything overdue. */
export function daysAgo(count: number): string {
  if (count <= 0) return 'today'
  if (count === 1) return 'yesterday'
  return `${count} days ago`
}
