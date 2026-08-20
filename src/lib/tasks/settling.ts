import { daysBetween, type DayKey } from '@/lib/dates/day'

/**
 * A task can be ticked until the end of the day after it was due, then it
 * settles for good: done, or not done.
 *
 * The window matches exactly how far the daily card can travel, so the
 * grace is always reachable — there is never a task you are still allowed
 * to finish but cannot get to.
 */
export function isSettled(dueOn: DayKey, today: DayKey): boolean {
  return daysBetween(dueOn, today) > 1
}

/** An unchecked task that has run out of grace. This is what a miss is. */
export function isMissed(dueOn: DayKey, today: DayKey, done: boolean): boolean {
  return !done && isSettled(dueOn, today)
}
