import { connection } from 'next/server'
import type { Subcategory } from '@/generated/prisma/enums'
import { clampDay, shiftDays, toDateColumn, todayIn, type DayKey } from '@/lib/dates/day'
import { MINUTES_IN_DAY, nowMinutesIn } from '@/lib/dates/time'
import { endOfTask, orderForDay } from '@/lib/tasks/ordering'
import { isSettled } from '@/lib/tasks/settling'
import { formatLine, parseLine } from '@/lib/tasks/syntax'
import { categoryOf, type Category } from '@/lib/taxonomy'
import type { DailyLine, DailyView, DayStanding } from '@/types/daily'
import { currentUser } from '../current-user'
import { db } from '../db'
import { materializeTasks } from '../tasks/materialize'

type TaskRow = {
  id: string
  title: string
  status: 'PENDING' | 'DONE'
  startMinute: number | null
  endMinute: number | null
  generated: boolean
  habit: { title: string; subcategory: Subcategory } | null
}

function standingOf(day: DayKey, today: DayKey): DayStanding {
  if (day === today) return 'today'
  return day < today ? 'yesterday' : 'tomorrow'
}

/**
 * What the editor shows. A reference that resolved lives in the habit
 * relation; one that did not is still sitting in the title text, dot and
 * all, so it can be re-tried on every read instead of being silently
 * downgraded to a free task.
 */
function rawOf(task: TaskRow): string {
  const written = task.habit
    ? formatLine({ reference: task.habit.title, name: task.title, start: null, end: null })
    : task.title

  return formatLine({
    reference: null,
    name: written,
    start: task.startMinute,
    end: task.endMinute,
  })
}

function toLine(task: TaskRow, day: DayKey, today: DayKey): DailyLine {
  // A resolved link lives in the relation. An unresolved one is still
  // sitting in the title text, so it is read back out of there — never by
  // re-parsing the composed line, which would fold the two together.
  const embedded = task.habit ? null : parseLine(task.title)
  const unresolved = embedded?.reference != null

  return {
    id: task.id,
    raw: rawOf(task),
    reference: task.habit?.title ?? embedded?.reference ?? null,
    category: task.habit ? categoryOf(task.habit.subcategory) : null,
    unresolved,
    name: unresolved ? (embedded?.name ?? '') : task.title,
    start: task.startMinute,
    end: task.endMinute,
    done: task.status === 'DONE',
    generated: task.generated,
    settled: isSettled(day, today),
    happeningNow: false,
  }
}

/** Only one line can be current, and only on today's card. */
function markCurrent(lines: DailyLine[], isToday: boolean, nowMinute: number): DailyLine[] {
  if (!isToday) return lines

  const timed = lines.map((line) => ({ start: line.start, end: line.end }))

  return lines.map((line, index) => {
    if (line.start === null || nowMinute < line.start) return line

    const finish = endOfTask(timed, index, MINUTES_IN_DAY)

    return { ...line, happeningNow: nowMinute < finish }
  })
}

type Vocabulary = { suggestions: string[]; references: Record<string, Category> }

/**
 * What the editor knows about your habits: the strings it can complete,
 * and which part of life each one belongs to so a line can be coloured
 * while it is still being typed.
 */
async function vocabularyFor(userId: string): Promise<Vocabulary> {
  const habits = await db.habit.findMany({
    where: { userId, archivedAt: null },
    select: {
      title: true,
      subcategory: true,
      rotation: true,
      tasks: { select: { title: true }, distinct: ['title'] },
    },
    orderBy: { createdAt: 'asc' },
  })
  const references: Record<string, Category> = {}
  const suggestions = habits.flatMap((habit) => {
    references[habit.title.toLowerCase()] = categoryOf(habit.subcategory)

    const names = new Set(
      [...habit.rotation, ...habit.tasks.map((task) => task.title)].filter(Boolean)
    )

    return [habit.title, ...[...names].map((name) => `${habit.title}.${name}`)]
  })

  return { suggestions, references }
}

export async function dailyView(requested?: string): Promise<DailyView> {
  await connection()

  const user = await currentUser()
  const today = todayIn(user.timeZone)
  const first = shiftDays(today, -1)
  const last = shiftDays(today, 1)
  const day = clampDay(requested ?? today, first, last)

  // Tomorrow's card must already show what the schedule expects, so the
  // window runs one day ahead rather than stopping at today.
  await materializeTasks(user.id, first, last)

  const [tasks, vocabulary] = await Promise.all([
    db.task.findMany({
      where: { userId: user.id, dueOn: toDateColumn(day) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        status: true,
        startMinute: true,
        endMinute: true,
        generated: true,
        habit: { select: { title: true, subcategory: true } },
      },
    }),
    vocabularyFor(user.id),
  ])

  // Timed lines always read in clock order; untimed ones hold their slot.
  const lines = markCurrent(
    orderForDay(tasks.map((task) => toLine(task, day, today))),
    day === today,
    nowMinutesIn(user.timeZone)
  )

  return {
    today,
    day,
    standing: standingOf(day, today),
    previous: day > first ? shiftDays(day, -1) : null,
    next: day < last ? shiftDays(day, 1) : null,
    lines,
    suggestions: vocabulary.suggestions,
    references: vocabulary.references,
    done: lines.filter((line) => line.done).length,
    total: lines.length,
  }
}
