import { clampDay, daysBetween, type DayKey } from '@/lib/dates/day'

export type SeasonWindow = {
  startsOn: DayKey
  endsOn: DayKey
  /** Length of the season in days. Varies with which quarter it is. */
  totalDays: number
  /** Which day of the season today is, 1-based and clamped to the season. */
  dayIndex: number
  /** Days remaining, today not counted. Zero once the season is over. */
  daysLeft: number
  /** 0 to 1, how far through the season we are. */
  elapsed: number
}

export function seasonWindow(startsOn: DayKey, endsOn: DayKey, today: DayKey): SeasonWindow {
  const totalDays = daysBetween(startsOn, endsOn) + 1
  const dayIndex = daysBetween(startsOn, clampDay(today, startsOn, endsOn)) + 1

  return {
    startsOn,
    endsOn,
    totalDays,
    dayIndex,
    daysLeft: Math.max(0, daysBetween(today, endsOn)),
    elapsed: dayIndex / totalDays,
  }
}
