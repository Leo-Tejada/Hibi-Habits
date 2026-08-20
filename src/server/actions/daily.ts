'use server'

import { revalidatePath } from 'next/cache'
import { TaskStatus } from '@/generated/prisma/enums'
import { clampDay, shiftDays, toDateColumn, todayIn, type DayKey } from '@/lib/dates/day'
import { isSettled } from '@/lib/tasks/settling'
import { parseLine } from '@/lib/tasks/syntax'
import type { LineEntry } from '@/types/daily'
import { currentUser } from '../current-user'
import { db } from '../db'

type Resolved = {
  habitId: string | null
  title: string
  startMinute: number | null
  endMinute: number | null
}

/** Only the three reachable days may be written to. */
function guardDay(day: string, today: DayKey): DayKey {
  return clampDay(day, shiftDays(today, -1), shiftDays(today, 1))
}

/**
 * Turn a typed line into columns.
 *
 * A reference that matches no habit is kept verbatim in the title, dot
 * and all, so the card can show it as a typo instead of quietly filing it
 * as an unrelated task that counts toward nothing.
 */
function resolveLine(raw: string, habits: Map<string, string>): Resolved | null {
  const parsed = parseLine(raw)

  if (!parsed) return null

  const habitId = parsed.reference ? (habits.get(parsed.reference.toLowerCase()) ?? null) : null
  const unresolved = parsed.reference !== null && habitId === null

  return {
    habitId,
    title: unresolved ? `${parsed.reference}.${parsed.name}` : parsed.name,
    startMinute: parsed.start,
    endMinute: parsed.end,
  }
}

async function habitsByName(userId: string): Promise<Map<string, string>> {
  const habits = await db.habit.findMany({
    where: { userId, archivedAt: null },
    select: { id: true, title: true },
  })

  return new Map(habits.map((habit) => [habit.title.toLowerCase(), habit.id]))
}

/**
 * Write a whole day at once.
 *
 * The editor sends every line in order, generated ones included. Those
 * are locked, so only their position is taken; any manual line missing
 * from the list was deleted, which is the only way a task ever goes away.
 */
export async function saveDay(day: string, entries: LineEntry[]): Promise<void> {
  const user = await currentUser()
  const today = todayIn(user.timeZone)
  const target = guardDay(day, today)

  const existing = await db.task.findMany({
    where: { userId: user.id, dueOn: toDateColumn(target) },
    select: { id: true, generated: true },
  })
  const generated = new Set(existing.filter((task) => task.generated).map((task) => task.id))
  const habits = await habitsByName(user.id)
  const kept = new Set<string>()

  // Collected rather than awaited one by one. The database is a long way
  // from the server, so a loop of awaits costs a round trip per line;
  // one transaction costs a single trip however long the day is.
  const writes = []

  for (const [index, entry] of entries.entries()) {
    if (entry.id && generated.has(entry.id)) {
      kept.add(entry.id)
      writes.push(
        db.task.updateMany({
          where: { id: entry.id, userId: user.id },
          data: { sortOrder: index },
        })
      )
      continue
    }

    const resolved = resolveLine(entry.raw, habits)

    if (!resolved) continue

    if (entry.id) {
      kept.add(entry.id)
      writes.push(
        db.task.updateMany({
          where: { id: entry.id, userId: user.id, generated: false },
          data: { ...resolved, sortOrder: index },
        })
      )
      continue
    }

    writes.push(
      db.task.create({
        data: {
          ...resolved,
          userId: user.id,
          dueOn: toDateColumn(target),
          sortOrder: index,
          generated: false,
        },
      })
    )
  }

  const removed = existing
    .filter((task) => !task.generated && !kept.has(task.id))
    .map((task) => task.id)

  if (removed.length > 0) {
    writes.push(db.task.deleteMany({ where: { id: { in: removed }, userId: user.id } }))
  }

  if (writes.length > 0) await db.$transaction(writes)

  revalidatePath('/daily')
}

/** Ticking a task. Refused once the task has settled, whichever way. */
export async function setTaskDone(taskId: string, done: boolean): Promise<void> {
  const user = await currentUser()
  const today = todayIn(user.timeZone)
  const task = await db.task.findFirst({
    where: { id: taskId, userId: user.id },
    select: { dueOn: true },
  })

  if (!task) return
  if (isSettled(task.dueOn.toISOString().slice(0, 10), today)) return

  await db.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: {
      status: done ? TaskStatus.DONE : TaskStatus.PENDING,
      completedAt: done ? new Date() : null,
    },
  })

  revalidatePath('/daily')
}
