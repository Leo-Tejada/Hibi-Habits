import type { Subcategory } from '@/generated/prisma/enums'
import { TaskStatus } from '@/generated/prisma/enums'
import { toDateColumn, type DayKey } from '@/lib/dates/day'
import { db } from '../db'

/**
 * How much of what a season asked for actually got done.
 *
 * Only tasks that hang off a habit are counted. A stray errand belongs
 * to no area of life, so it cannot be evidence about one — that is the
 * whole reason `Task.habitId` is nullable.
 *
 * Only days already materialised are in the window, so nothing is marked
 * down for a Thursday that has not happened yet.
 */
export type CompletionTally = { done: number; total: number }

type CountedRow = { habitId: string | null; status: TaskStatus; _count: { _all: number } }

/** Tasks per habit across a window, split by status. */
async function tallyByHabit(
  userId: string,
  from: DayKey,
  to: DayKey
): Promise<Map<string, CompletionTally>> {
  const rows = await db.task.groupBy({
    by: ['habitId', 'status'],
    where: {
      userId,
      habitId: { not: null },
      dueOn: { gte: toDateColumn(from), lte: toDateColumn(to) },
    },
    _count: { _all: true },
  })

  return fold(rows)
}

function fold(rows: CountedRow[]): Map<string, CompletionTally> {
  const tallies = new Map<string, CompletionTally>()

  for (const row of rows) {
    if (!row.habitId) continue

    const found = tallies.get(row.habitId) ?? { done: 0, total: 0 }

    found.total += row._count._all
    if (row.status === TaskStatus.DONE) found.done += row._count._all
    tallies.set(row.habitId, found)
  }
  return tallies
}

function add(into: Map<Subcategory, CompletionTally>, area: Subcategory, more: CompletionTally) {
  const found = into.get(area) ?? { done: 0, total: 0 }

  found.done += more.done
  found.total += more.total
  into.set(area, found)
}

/**
 * The same counting, rolled up into the nine areas.
 *
 * The rollup happens here rather than in SQL because a task records its
 * habit, and only the habit knows its area — grouping by a relation is
 * not something `groupBy` can do. Both queries are small and indexed.
 *
 * Areas the window asked nothing of are absent from the map, which reads
 * as "no evidence" rather than as a zero nobody earned.
 */
export async function areaCompletion(
  userId: string,
  from: DayKey,
  to: DayKey
): Promise<Map<Subcategory, CompletionTally>> {
  const [tallies, habits] = await Promise.all([
    tallyByHabit(userId, from, to),
    db.habit.findMany({ where: { userId }, select: { id: true, subcategory: true } }),
  ])
  const areaOf = new Map(habits.map((habit) => [habit.id, habit.subcategory]))
  const byArea = new Map<Subcategory, CompletionTally>()

  for (const [habitId, tally] of tallies) {
    const area = areaOf.get(habitId)

    if (area) add(byArea, area, tally)
  }
  return byArea
}
