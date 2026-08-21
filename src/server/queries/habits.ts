import { connection } from 'next/server'
import { todayIn } from '@/lib/dates/day'
import { quarterLabel, quarterRefOf, quarterStart } from '@/lib/seasons/quarter'
import { toDateColumn } from '@/lib/dates/day'
import type { HabitsView } from '@/types/habits'
import { currentUser } from '../current-user'
import { db } from '../db'

/**
 * Everything the habits graph needs, which is not much: the graph draws
 * structure, not statistics. How a season has actually gone is counted
 * in `completion.ts` and shown on the homepage instead.
 *
 * Archived habits are included. They render faded, so the shape of a
 * life you used to lead stays visible.
 */
export async function habitsView(): Promise<HabitsView> {
  // Without this the page prerenders at build time and ships a habit
  // list frozen at whatever the database held when it was compiled.
  // The view reads the wall clock as well, which is request-time by
  // definition.
  await connection()

  const user = await currentUser()
  const today = todayIn(user.timeZone)
  const quarter = quarterRefOf(today)
  const season = await db.season.findFirst({
    where: { userId: user.id, startsOn: toDateColumn(quarterStart(quarter)) },
  })

  const habits = await db.habit.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, subcategory: true, questId: true, archivedAt: true },
    orderBy: [{ subcategory: 'asc' }, { title: 'asc' }],
  })

  const quests = season
    ? await db.quest.findMany({
        where: { userId: user.id, seasonId: season.id },
        select: { id: true, title: true, subcategory: true, kind: true },
        orderBy: [{ sortOrder: 'asc' }],
      })
    : []

  return {
    today,
    seasonLabel: quarterLabel(quarterRefOf(today)),
    habits: habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      subcategory: habit.subcategory,
      questId: habit.questId,
      archived: habit.archivedAt !== null,
    })),
    quests: quests.map((quest) => ({
      id: quest.id,
      title: quest.title,
      subcategory: quest.subcategory,
      kind: quest.kind,
    })),
  }
}
