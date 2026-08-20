import { TaskStatus } from '@/generated/prisma/enums'
import { toDateColumn, type DayKey } from '@/lib/dates/day'
import type { Tally } from '@/types/home'
import { db } from '../db'

const EMPTY: Tally = { done: 0, pending: 0, total: 0 }

const FIELD: Record<TaskStatus, keyof Omit<Tally, 'total'>> = {
  DONE: 'done',
  PENDING: 'pending',
}

/** How a stretch of days went, counted by status. */
export async function tallyBetween(userId: string, from: DayKey, to: DayKey): Promise<Tally> {
  const rows = await db.task.groupBy({
    by: ['status'],
    where: { userId, dueOn: { gte: toDateColumn(from), lte: toDateColumn(to) } },
    _count: { _all: true },
  })

  return rows.reduce<Tally>(
    (tally, row) => ({
      ...tally,
      [FIELD[row.status]]: row._count._all,
      total: tally.total + row._count._all,
    }),
    { ...EMPTY }
  )
}
