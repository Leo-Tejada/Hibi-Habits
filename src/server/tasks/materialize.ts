import type { HabitModel } from '@/generated/prisma/models'
import { fromDateColumn, toDateColumn, type DayKey } from '@/lib/dates/day'
import { MINUTES_IN_DAY } from '@/lib/dates/time'
import { daysWanted, rotationNameFor, type Schedule } from '@/lib/habits/schedule'
import { db } from '../db'

type NewTask = {
  userId: string
  habitId: string
  title: string
  dueOn: Date
  unit: string | null
  target: number | null
  startMinute: number | null
  endMinute: number | null
  sortOrder: number
  generated: boolean
}

export function scheduleOf(habit: HabitModel): Schedule {
  return {
    kind: habit.scheduleKind,
    weekdays: habit.weekdays,
    intervalDays: habit.intervalDays,
    anchorOn: fromDateColumn(habit.anchorOn),
  }
}

/** The tasks a single habit expects across a range of days. */
export function plannedTasks(habit: HabitModel, from: DayKey, to: DayKey): NewTask[] {
  const schedule = scheduleOf(habit)

  return daysWanted(schedule, from, to).map((day) => ({
    userId: habit.userId,
    habitId: habit.id,
    title: rotationNameFor(schedule, habit.rotation, day),
    dueOn: toDateColumn(day),
    unit: habit.unit,
    target: habit.target,
    startMinute: habit.startMinute,
    endMinute: habit.endMinute,
    sortOrder: habit.startMinute ?? MINUTES_IN_DAY,
    generated: true,
  }))
}

function slotOf(habitId: string | null, dueOn: Date): string {
  return `${habitId}|${fromDateColumn(dueOn)}`
}

/**
 * Write out every task the user's live habits expect between two days.
 *
 * Safe to run repeatedly: already-generated slots are read first and
 * skipped. Doing it here rather than with a unique constraint leaves you
 * free to add a second session for the same habit by hand.
 */
export async function materializeTasks(userId: string, from: DayKey, to: DayKey): Promise<number> {
  const [habits, already] = await Promise.all([
    db.habit.findMany({ where: { userId, archivedAt: null } }),
    db.task.findMany({
      where: {
        userId,
        generated: true,
        dueOn: { gte: toDateColumn(from), lte: toDateColumn(to) },
      },
      select: { habitId: true, dueOn: true },
    }),
  ])
  const filled = new Set(already.map((task) => slotOf(task.habitId, task.dueOn)))
  const rows = habits
    .flatMap((habit) => plannedTasks(habit, from, to))
    .filter((row) => !filled.has(slotOf(row.habitId, row.dueOn)))

  if (rows.length === 0) return 0

  const written = await db.task.createMany({ data: rows })
  return written.count
}
