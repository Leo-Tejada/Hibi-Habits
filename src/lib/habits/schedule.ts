import { ScheduleKind } from '@/generated/prisma/enums'
import { daysBetween, daysInRange, weekdayOf, type DayKey } from '@/lib/dates/day'

/**
 * The part of a habit that decides which days it wants a task on.
 *
 * This is what makes a missed task detectable: a task only counts as
 * missed if some schedule expected it on a day that has already passed.
 */
export type Schedule = {
  kind: ScheduleKind
  weekdays: number[]
  intervalDays: number | null
  anchorOn: DayKey
}

export function wantsDay(schedule: Schedule, day: DayKey): boolean {
  if (day < schedule.anchorOn) return false

  if (schedule.kind === ScheduleKind.WEEKLY_DAYS) {
    return schedule.weekdays.includes(weekdayOf(day))
  }
  return fallsOnInterval(schedule, day)
}

function fallsOnInterval(schedule: Schedule, day: DayKey): boolean {
  const interval = schedule.intervalDays

  if (!interval || interval < 1) return false
  return daysBetween(schedule.anchorOn, day) % interval === 0
}

/** Every day in the range the habit wants a task on. */
export function daysWanted(schedule: Schedule, from: DayKey, to: DayKey): DayKey[] {
  return daysInRange(from, to).filter((day) => wantsDay(schedule, day))
}

/** Roughly how often the habit comes round, for showing an expected rate. */
export function timesPerWeek(schedule: Schedule): number {
  if (schedule.kind === ScheduleKind.WEEKLY_DAYS) return schedule.weekdays.length
  if (!schedule.intervalDays) return 0
  return 7 / schedule.intervalDays
}

/**
 * How many times the habit has come round by `day`, counting from its
 * anchor. Drives the rotation: occurrence 0 takes the first name, 1 the
 * second, and it wraps.
 */
export function occurrenceIndex(schedule: Schedule, day: DayKey): number {
  return daysWanted(schedule, schedule.anchorOn, day).length - 1
}

/** The name this occurrence should carry, or '' when the habit has no rotation. */
export function rotationNameFor(
  schedule: Schedule,
  rotation: string[],
  day: DayKey
): string {
  if (rotation.length === 0) return ''
  return rotation[occurrenceIndex(schedule, day) % rotation.length]
}
