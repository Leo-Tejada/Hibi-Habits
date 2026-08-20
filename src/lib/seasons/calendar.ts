import { daysInRange, weekdayOf, type DayKey } from '@/lib/dates/day'
import { monthLabel } from '@/lib/dates/format'

/** Weeks run Monday to Sunday. */
const DAYS_PER_WEEK = 7

export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export type CalendarDay = {
  day: DayKey
  dayOfMonth: number
  state: 'past' | 'today' | 'future'
}

/** A cell with no day in it: padding before the 1st or after the last. */
export type CalendarCell = CalendarDay | null

export type CalendarMonth = {
  key: string
  label: string
  weeks: CalendarCell[][]
}

function stateOf(day: DayKey, today: DayKey): CalendarDay['state'] {
  if (day === today) return 'today'
  return day < today ? 'past' : 'future'
}

/** Monday is column 0, Sunday column 6. */
function columnOf(day: DayKey): number {
  return (weekdayOf(day) + 6) % DAYS_PER_WEEK
}

function chunkIntoWeeks(cells: CalendarCell[]): CalendarCell[][] {
  const weeks: CalendarCell[][] = []

  for (let start = 0; start < cells.length; start += DAYS_PER_WEEK) {
    const week = cells.slice(start, start + DAYS_PER_WEEK)

    weeks.push([...week, ...Array<CalendarCell>(DAYS_PER_WEEK - week.length).fill(null)])
  }
  return weeks
}

function buildMonth(days: DayKey[], today: DayKey): CalendarMonth {
  const leading = Array<CalendarCell>(columnOf(days[0])).fill(null)
  const cells: CalendarCell[] = days.map((day) => ({
    day,
    dayOfMonth: Number(day.slice(8, 10)),
    state: stateOf(day, today),
  }))

  return {
    key: days[0].slice(0, 7),
    label: monthLabel(days[0]),
    weeks: chunkIntoWeeks([...leading, ...cells]),
  }
}

/**
 * The season laid out as ordinary month calendars — the three months it
 * spans, each a Monday-first grid. Only days inside the season appear;
 * everything else is an empty cell.
 */
export function seasonMonths(startsOn: DayKey, endsOn: DayKey, today: DayKey): CalendarMonth[] {
  const byMonth = new Map<string, DayKey[]>()

  for (const day of daysInRange(startsOn, endsOn)) {
    const month = day.slice(0, 7)

    byMonth.set(month, [...(byMonth.get(month) ?? []), day])
  }
  return [...byMonth.values()].map((days) => buildMonth(days, today))
}
