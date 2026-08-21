import { QuestKind, TaskStatus } from '@/generated/prisma/enums'
import { toDateColumn, type DayKey } from '@/lib/dates/day'
import { categoryOf } from '@/lib/taxonomy'
import type { QuestCard } from '@/types/home'
import { db } from '../db'

type Recent = { done: number; total: number }

const NO_RECENT: Recent = { done: 0, total: 0 }

/**
 * Finished-versus-expected per habit over a window, in one query. A
 * quest's recent figures are its serving habit's: the practice earns the
 * goal, so the numbers are the practice's. Loose quests have none.
 */
async function recentByHabit(
  habitIds: string[],
  from: DayKey,
  to: DayKey
): Promise<Map<string, Recent>> {
  if (habitIds.length === 0) return new Map()

  const rows = await db.task.groupBy({
    by: ['habitId', 'status'],
    where: {
      habitId: { in: habitIds },
      dueOn: { gte: toDateColumn(from), lte: toDateColumn(to) },
    },
    _count: { _all: true },
  })
  const byHabit = new Map<string, Recent>()

  for (const row of rows) {
    if (!row.habitId) continue

    const entry = byHabit.get(row.habitId) ?? { ...NO_RECENT }

    entry.total += row._count._all
    if (row.status === TaskStatus.DONE) entry.done += row._count._all
    byHabit.set(row.habitId, entry)
  }
  return byHabit
}

/**
 * The quests of a season, split into the three mains and the rest.
 *
 * Completed and abandoned quests are included: a season you have come
 * back to write up must still show what you set out to do, or the page
 * would be blank exactly when you need it.
 */
export async function seasonQuests(
  seasonId: string,
  from: DayKey,
  to: DayKey
): Promise<{ main: QuestCard[]; side: QuestCard[] }> {
  const quests = await db.quest.findMany({
    where: { seasonId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { habit: { select: { title: true, subcategory: true } } },
  })
  const serving = quests
    .map((quest) => quest.habitId)
    .filter((habitId): habitId is string => habitId !== null)
  const recent = await recentByHabit(serving, from, to)
  const cards = quests.map((quest): QuestCard & { kind: QuestKind } => {
    // An attached quest belongs to its habit's area, a loose one to its
    // own — both cannot be set, so one of the two is always here.
    const area = quest.habit?.subcategory ?? quest.subcategory!
    const window = quest.habitId ? (recent.get(quest.habitId) ?? NO_RECENT) : NO_RECENT

    return {
      id: quest.id,
      kind: quest.kind,
      category: categoryOf(area),
      area,
      title: quest.title,
      intent: quest.intent,
      progress: quest.progress,
      status: quest.status,
      habitTitle: quest.habit?.title ?? null,
      recentDone: window.done,
      recentTotal: window.total,
    }
  })

  return {
    main: cards.filter((card) => card.kind === QuestKind.MAIN),
    side: cards.filter((card) => card.kind === QuestKind.SIDE),
  }
}
