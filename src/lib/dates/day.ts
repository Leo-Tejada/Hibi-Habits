/**
 * A calendar day written as 'YYYY-MM-DD'.
 *
 * The app thinks in days, not instants. Every day-keyed column in the
 * database is a Postgres `date`, which Prisma hands back as a Date at
 * midnight UTC — so a plain string is the honest representation and the
 * conversions live here and nowhere else.
 */
export type DayKey = string

const MS_PER_DAY = 86_400_000

/** The day it currently is for someone in `timeZone`. */
export function todayIn(timeZone: string): DayKey {
  return dayKeyOf(new Date(), timeZone)
}

/** Which calendar day an instant falls on, seen from `timeZone`. */
export function dayKeyOf(instant: Date, timeZone: string): DayKey {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

/** Value to store in, or compare against, a `@db.Date` column. */
export function toDateColumn(day: DayKey): Date {
  return new Date(`${day}T00:00:00.000Z`)
}

/** Read a `@db.Date` column back into a day. */
export function fromDateColumn(value: Date): DayKey {
  return value.toISOString().slice(0, 10)
}

export function shiftDays(day: DayKey, delta: number): DayKey {
  return fromDateColumn(new Date(toDateColumn(day).getTime() + delta * MS_PER_DAY))
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((toDateColumn(to).getTime() - toDateColumn(from).getTime()) / MS_PER_DAY)
}

/** 0 for Sunday through 6 for Saturday. */
export function weekdayOf(day: DayKey): number {
  return toDateColumn(day).getUTCDay()
}

/** Every day from `from` to `to`, both included. */
export function daysInRange(from: DayKey, to: DayKey): DayKey[] {
  const span = daysBetween(from, to)

  if (span < 0) return []
  return Array.from({ length: span + 1 }, (_, offset) => shiftDays(from, offset))
}

/** Calendar-month arithmetic, clamping to the last valid day of the month. */
export function shiftMonths(day: DayKey, months: number): DayKey {
  const date = toDateColumn(day)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate()

  target.setUTCDate(Math.min(date.getUTCDate(), lastDay))
  return fromDateColumn(target)
}

export function isBefore(day: DayKey, other: DayKey): boolean {
  return day < other
}

export function clampDay(day: DayKey, min: DayKey, max: DayKey): DayKey {
  if (day < min) return min
  if (day > max) return max
  return day
}
