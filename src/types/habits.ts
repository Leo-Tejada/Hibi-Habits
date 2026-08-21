import type { Subcategory } from '@/generated/prisma/enums'
import type { DayKey } from '@/lib/dates/day'
import type { QuestKind } from '@/generated/prisma/enums'

export type HabitNodeView = {
  id: string
  title: string
  subcategory: Subcategory
  /** Archived habits still appear, faded, so a past life stays visible. */
  archived: boolean
}

export type QuestNodeView = {
  id: string
  title: string
  /** Only a loose quest carries an area of its own; an attached one
   *  belongs to its habit's. */
  subcategory: Subcategory | null
  habitId: string | null
  kind: QuestKind
}

export type HabitsView = {
  today: DayKey
  seasonLabel: string
  habits: HabitNodeView[]
  quests: QuestNodeView[]
}
