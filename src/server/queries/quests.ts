import { QuestKind, TaskStatus } from '@/generated/prisma/enums'
import { toDateColumn, type DayKey } from '@/lib/dates/day'
import { categoryOf } from '@/lib/taxonomy'
import type { QuestCard } from '@/types/home'
import { db } from '../db'

type Recent = { done: number; total: number }

const NO_RECENT: Recent = { done: 0, total: 0 }

/** Finished-versus-expected per quest over a window, in one query. */
async function recentByQuest(
  questIds: string[],
  from: DayKey,
  to: DayKey
): Promise<Map<string, Recent>> {
  const rows = await db.task.groupBy({
    by: ['questId', 'status'],
    where: {
      questId: { in: questIds },
      dueOn: { gte: toDateColumn(from), lte: toDateColumn(to) },
    },
    _count: { _all: true },
  })
  const byQuest = new Map<string, Recent>()

  for (const row of rows) {
    if (!row.questId) continue

    const entry = byQuest.get(row.questId) ?? { ...NO_RECENT }

    entry.total += row._count._all
    if (row.status === TaskStatus.DONE) entry.done += row._count._all
    byQuest.set(row.questId, entry)
  }
  return byQuest
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
    include: { _count: { select: { habits: true } } },
  })
  const recent = await recentByQuest(
    quests.map((quest) => quest.id),
    from,
    to
  )
  const cards = quests.map((quest): QuestCard & { kind: QuestKind } => {
    const window = recent.get(quest.id) ?? NO_RECENT

    return {
      id: quest.id,
      kind: quest.kind,
      category: categoryOf(quest.subcategory),
      area: quest.subcategory,
      title: quest.title,
      intent: quest.intent,
      progress: quest.progress,
      status: quest.status,
      habitCount: quest._count.habits,
      recentDone: window.done,
      recentTotal: window.total,
    }
  })

  return {
    main: cards.filter((card) => card.kind === QuestKind.MAIN),
    side: cards.filter((card) => card.kind === QuestKind.SIDE),
  }
}
