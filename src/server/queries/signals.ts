import { TaskStatus } from '@/generated/prisma/enums'
import { daysBetween, fromDateColumn, shiftDays, toDateColumn, type DayKey } from '@/lib/dates/day'
import { daysAgo } from '@/lib/dates/format'
import { quarterLabel, quarterRefOf } from '@/lib/seasons/quarter'
import { timesPerWeek } from '@/lib/habits/schedule'
import type { SeasonHeader, Signal } from '@/types/home'
import { db } from '../db'

/** How far back a miss is still worth mentioning. */
const MISS_WINDOW_DAYS = 7

/** How close to the end of a season before the reflection is worth raising. */
const CLOSING_DAYS = 14

/** Most stalled habits to name before the panel becomes noise. */
const MAX_STALLED = 2

async function unfinishedRecently(userId: string, today: DayKey): Promise<Signal | null> {
  const missed = await db.task.findMany({
    where: {
      userId,
      status: TaskStatus.PENDING,
      dueOn: { gte: toDateColumn(shiftDays(today, -MISS_WINDOW_DAYS)), lt: toDateColumn(today) },
    },
    select: { title: true, dueOn: true },
    orderBy: { dueOn: 'desc' },
  })

  if (missed.length === 0) return null

  const latest = missed[0]
  const noun = missed.length === 1 ? 'task' : 'tasks'

  return {
    id: 'unfinished',
    level: 'alert',
    text: `${missed.length} ${noun} left unfinished this week`,
    detail: `${latest.title} — ${daysAgo(daysBetween(fromDateColumn(latest.dueOn), today))}`,
  }
}

async function journalGap(userId: string, today: DayKey): Promise<Signal | null> {
  const entry = await db.journalEntry.findUnique({
    where: { userId_entryOn: { userId, entryOn: toDateColumn(today) } },
    select: { id: true },
  })

  if (entry) return null
  return {
    id: 'journal',
    level: 'note',
    text: 'Today has no journal entry',
    detail: 'Mood and energy go unrecorded until you write one.',
  }
}

function seasonClosing(season: SeasonHeader): Signal | null {
  if (season.standing !== 'current' || season.daysLeft > CLOSING_DAYS) return null

  return {
    id: 'closing',
    level: 'note',
    text: `Season closes in ${season.daysLeft} days`,
    detail: 'Set aside time for the reflection and the next set of quests.',
  }
}

/**
 * A season that ended without a reflection. This is the signal that
 * rescues the late writer: the season has rolled over, but the one you
 * still owe an ending to is named here, with the quarter to go back to.
 */
async function unwrittenReflection(userId: string, today: DayKey): Promise<Signal | null> {
  const closed = await db.season.findFirst({
    where: {
      userId,
      endsOn: { lt: toDateColumn(today) },
      OR: [{ reflection: null }, { reflection: { completedAt: null } }],
    },
    orderBy: { endsOn: 'desc' },
    select: { name: true, startsOn: true },
  })

  if (!closed) return null

  const ref = quarterRefOf(fromDateColumn(closed.startsOn))

  return {
    id: 'reflection',
    level: 'alert',
    text: `${quarterLabel(ref)} closed without a reflection`,
    detail: `${closed.name} is still open to write up — switch to it in the corner.`,
  }
}

type HabitPace = {
  id: string
  title: string
  scheduleKind: Parameters<typeof timesPerWeek>[0]['kind']
  weekdays: number[]
  intervalDays: number | null
  anchorOn: Date
}

/** A habit is stalled once it has gone three of its own cycles untouched. */
function stalledFor(habit: HabitPace, lastDone: DayKey | null, today: DayKey): number | null {
  const perWeek = timesPerWeek({
    kind: habit.scheduleKind,
    weekdays: habit.weekdays,
    intervalDays: habit.intervalDays,
    anchorOn: fromDateColumn(habit.anchorOn),
  })

  if (perWeek <= 0) return null

  const from = lastDone ?? fromDateColumn(habit.anchorOn)
  const gap = daysBetween(from, today)
  const tolerated = Math.max(10, (7 / perWeek) * 3)

  return gap > tolerated ? gap : null
}

async function stalledHabits(userId: string, today: DayKey): Promise<Signal[]> {
  const habits = await db.habit.findMany({
    where: { userId, archivedAt: null },
    select: {
      id: true,
      title: true,
      scheduleKind: true,
      weekdays: true,
      intervalDays: true,
      anchorOn: true,
    },
  })
  const lastDone = await db.task.groupBy({
    by: ['habitId'],
    where: { userId, status: TaskStatus.DONE, habitId: { not: null } },
    _max: { dueOn: true },
  })
  const seen = new Map(
    lastDone.map((row) => [row.habitId, row._max.dueOn ? fromDateColumn(row._max.dueOn) : null])
  )

  return habits
    .map((habit) => ({ habit, gap: stalledFor(habit, seen.get(habit.id) ?? null, today) }))
    .filter((row): row is { habit: (typeof habits)[number]; gap: number } => row.gap !== null)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, MAX_STALLED)
    .map(({ habit, gap }) => ({
      id: `stalled-${habit.id}`,
      level: 'alert' as const,
      text: `${habit.title} has gone quiet`,
      detail: `Last done ${daysAgo(gap)}.`,
    }))
}

/**
 * Everything the homepage should raise, derived on read. Nothing about a
 * signal is stored, so none of it can go stale.
 */
export async function collectSignals(
  userId: string,
  today: DayKey,
  season: SeasonHeader
): Promise<Signal[]> {
  const [unfinished, journal, stalled, reflection] = await Promise.all([
    unfinishedRecently(userId, today),
    journalGap(userId, today),
    stalledHabits(userId, today),
    unwrittenReflection(userId, today),
  ])
  const found = [reflection, unfinished, ...stalled, seasonClosing(season), journal]

  return found.filter((signal): signal is Signal => signal !== null)
}
