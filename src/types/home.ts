import type { QuestStatus, Subcategory } from '@/generated/prisma/enums'
import type { DayKey } from '@/lib/dates/day'
import type { CalendarMonth } from '@/lib/seasons/calendar'
import type { QuarterKey } from '@/lib/seasons/quarter'
import type { SeasonNav } from '@/lib/seasons/nav'
import type { Category } from '@/lib/taxonomy'

/**
 * A season's window is arithmetic — every quarter has one, whether or not
 * anybody has set quests for it. `id` and `name` are null until a Season
 * row exists, which is how an unopened quarter is told apart from a
 * missing one.
 */
export type SeasonHeader = {
  id: string | null
  name: string | null
  quarter: QuarterKey
  label: string
  startsOn: DayKey
  endsOn: DayKey
  totalDays: number
  dayIndex: number
  daysLeft: number
  elapsed: number
  /** Where the viewed quarter sits relative to today. */
  standing: 'past' | 'current' | 'future'
  daysUntilStart: number
}

export type QuestCard = {
  id: string
  category: Category
  area: Subcategory
  title: string
  intent: string | null
  progress: number
  status: QuestStatus
  habitCount: number
  recentDone: number
  recentTotal: number
}

export type Signal = {
  id: string
  level: 'alert' | 'note'
  text: string
  detail?: string
}

export type Tally = { done: number; pending: number; total: number }

export type { SeasonNav }

export type HomeView = {
  today: DayKey
  userName: string
  nav: SeasonNav
  season: SeasonHeader
  months: CalendarMonth[]
  mainQuests: QuestCard[]
  sideQuests: QuestCard[]
  signals: Signal[]
  todayTally: Tally
  recentTally: Tally
}
