import type { HabitModel } from '@/generated/prisma/models'
import { fromDateColumn, toDateColumn, type DayKey } from '@/lib/dates/day'
import { daysWanted } from '@/lib/habits/schedule'
import { db } from '../db'

type NewTask = {
  userId: string
  habitId: string
  questId: string | null
  title: string
  dueOn: Date
  unit: string | null
  target: number | null
}

/** The tasks a single habit expects across a range of days. */
export function plannedTasks(habit: HabitModel, from: DayKey, to: DayKey): NewTask[] {
  const schedule = {
    kind: habit.scheduleKind,
    weekdays: habit.weekdays,
    intervalDays: habit.intervalDays,
    anchorOn: fromDateColumn(habit.anchorOn),
  }

  return daysWanted(schedule, from, to).map((day) => ({
    userId: habit.userId,
    habitId: habit.id,
    // Copied, not joined: a task records the quest it served at the time,
    // so re-pointing a habit later never rewrites what already happened.
    questId: habit.questId,
    title: habit.title,
    dueOn: toDateColumn(day),
    unit: habit.unit,
    target: habit.target,
  }))
}

/**
 * Write out every task the user's live habits expect between two days.
 *
 * Safe to run repeatedly: the unique index on (habitId, dueOn) means a
 * second run inserts nothing.
 */
export async function materializeTasks(userId: string, from: DayKey, to: DayKey): Promise<number> {
  const habits = await db.habit.findMany({ where: { userId, archivedAt: null } })
  const rows = habits.flatMap((habit) => plannedTasks(habit, from, to))

  if (rows.length === 0) return 0

  const written = await db.task.createMany({ data: rows, skipDuplicates: true })
  return written.count
}
