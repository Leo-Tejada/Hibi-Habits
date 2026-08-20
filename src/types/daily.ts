import type { DayKey } from '@/lib/dates/day'

/** Which of the three reachable days is on the card. */
export type DayStanding = 'yesterday' | 'today' | 'tomorrow'

export type DailyLine = {
  id: string
  /** What the editor shows for this task, and what parsing it returns. */
  raw: string
  /** The habit this line is attached to, once resolved. */
  reference: string | null
  /** Written like a link but matching no habit — a typo worth seeing. */
  unresolved: boolean
  name: string
  start: number | null
  end: number | null
  done: boolean
  /** Written by a habit's schedule: locked in the editor. */
  generated: boolean
  /** Past its grace: the checkbox no longer moves. */
  settled: boolean
  happeningNow: boolean
}

export type DailyView = {
  today: DayKey
  day: DayKey
  standing: DayStanding
  /** Null at the ends of the three-day range. */
  previous: DayKey | null
  next: DayKey | null
  lines: DailyLine[]
  /** `Habit.Task` strings the editor offers while you type. */
  suggestions: string[]
  done: number
  total: number
}

/** One line as the editor holds it: an existing task, or something new. */
export type LineEntry = { id: string | null; raw: string }
