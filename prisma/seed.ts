import { QuestStatus, TaskStatus } from '../src/generated/prisma/enums'
import {
  daysBetween,
  daysInRange,
  fromDateColumn,
  shiftDays,
  toDateColumn,
  todayIn,
  type DayKey,
} from '../src/lib/dates/day'
import { monthLabel } from '../src/lib/dates/format'
import {
  quarterEnd,
  quarterRefOf,
  quarterStart,
  shiftQuarter,
  type QuarterRef,
} from '../src/lib/seasons/quarter'
import { db } from '../src/server/db'
import { materializeTasks } from '../src/server/tasks/materialize'
import { HABITS, PAST_SEASONS, QUESTS, type PastSeasonSpec, type QuestSpec } from './seed-content'

/** Fixed so re-seeding produces the same history twice. */
const RANDOM_SEED = 20260820

function makeRandom(seed: number): () => number {
  let state = seed

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

async function wipe(): Promise<void> {
  // Every other table hangs off User by cascade.
  await db.user.deleteMany({})
}

function seasonName(startsOn: DayKey, endsOn: DayKey): string {
  return `${monthLabel(startsOn)} – ${monthLabel(endsOn)} ${endsOn.slice(0, 4)}`
}

async function createSeason(userId: string, ref: QuarterRef) {
  const startsOn = quarterStart(ref)
  const endsOn = quarterEnd(ref)

  return db.season.create({
    data: {
      userId,
      name: seasonName(startsOn, endsOn),
      startsOn: toDateColumn(startsOn),
      endsOn: toDateColumn(endsOn),
    },
  })
}

/**
 * Habits first: quests hang off them, so their ids must exist to point
 * at. The map lets a quest name the habit that serves it.
 */
async function createHabits(userId: string, anchorOn: DayKey): Promise<Map<string, string>> {
  const byTitle = new Map<string, string>()

  for (const { area, habit } of HABITS) {
    const created = await db.habit.create({
      data: {
        userId,
        subcategory: area,
        title: habit.title,
        scheduleKind: habit.scheduleKind,
        weekdays: habit.weekdays ?? [],
        intervalDays: habit.intervalDays ?? null,
        anchorOn: toDateColumn(anchorOn),
        rotation: habit.rotation ?? [],
        startMinute: habit.startMinute ?? null,
        endMinute: habit.endMinute ?? null,
        unit: habit.unit ?? null,
        target: habit.target ?? null,
      },
    })

    byTitle.set(habit.title, created.id)
  }

  return byTitle
}

async function createQuest(
  userId: string,
  seasonId: string,
  spec: QuestSpec,
  habitsByTitle: Map<string, string>,
  index: number
): Promise<void> {
  // A quest either hangs off the habit that serves it — and then takes
  // that habit's area — or is loose and carries an area of its own.
  const habitId = spec.habitTitle ? (habitsByTitle.get(spec.habitTitle) ?? null) : null

  if (spec.habitTitle && !habitId) {
    throw new Error(`Quest "${spec.title}" names a habit that does not exist: ${spec.habitTitle}`)
  }
  if (!habitId && !spec.area) {
    throw new Error(`Quest "${spec.title}" is loose but carries no area`)
  }

  await db.quest.create({
    data: {
      userId,
      seasonId,
      kind: spec.kind,
      habitId,
      subcategory: habitId ? null : (spec.area ?? null),
      title: spec.title,
      intent: spec.intent ?? null,
      progress: spec.progress,
      status: QuestStatus.ACTIVE,
      sortOrder: index,
    },
  })
}

async function createQuests(
  userId: string,
  seasonId: string,
  habitsByTitle: Map<string, string>
): Promise<void> {
  for (const [index, spec] of QUESTS.entries()) {
    await createQuest(userId, seasonId, spec, habitsByTitle, index)
  }
}

/** A quarter that has closed: written up and left alone. */
async function createClosedSeason(
  userId: string,
  ref: QuarterRef,
  spec: PastSeasonSpec
): Promise<void> {
  const season = await createSeason(userId, ref)

  for (const [index, quest] of spec.quests.entries()) {
    await db.quest.create({
      data: {
        userId,
        seasonId: season.id,
        kind: quest.kind,
        subcategory: quest.area,
        title: quest.title,
        intent: quest.intent ?? null,
        progress: quest.progress,
        status: quest.progress >= 60 ? QuestStatus.COMPLETED : QuestStatus.ABANDONED,
        sortOrder: index,
      },
    })
  }

  const hasReflection = Object.values(spec.reflection).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  )

  if (!hasReflection) return

  await db.seasonReflection.create({
    data: {
      seasonId: season.id,
      wentWell: spec.reflection.wentWell ?? null,
      wentBadly: spec.reflection.wentBadly ?? null,
      learned: spec.reflection.learned ?? null,
      carryForward: spec.reflection.carryForward ?? null,
      completedAt: new Date(`${quarterEnd(ref)}T20:00:00.000Z`),
      ratings: {
        create: spec.reflection.ratings.map((rating) => ({
          subcategory: rating.area,
          score: rating.score,
        })),
      },
    },
  })
}

type Outcome = { id: string; status: TaskStatus; value: number | null; completedAt: Date | null }

type SeededTask = { id: string; dueOn: Date; target: number | null }

function markDone(task: SeededTask, random: () => number): Outcome {
  const spread = 0.8 + random() * 0.45

  return {
    id: task.id,
    status: TaskStatus.DONE,
    value: task.target === null ? null : Math.round(task.target * spread),
    completedAt: new Date(task.dueOn.getTime() + 19 * 3_600_000),
  }
}

/**
 * Decide how a past task went. Recent days miss a little more often so
 * the homepage has something real to warn about.
 */
function decideOutcome(task: SeededTask, today: DayKey, random: () => number): Outcome | null {
  const age = daysBetween(fromDateColumn(task.dueOn), today)
  const doneChance = age <= 7 ? 0.8 : 0.88
  const roll = random()

  if (roll < doneChance) return markDone(task, random)
  return null
}

async function applyOutcomes(outcomes: Outcome[]): Promise<void> {
  const CHUNK = 100

  for (let start = 0; start < outcomes.length; start += CHUNK) {
    const chunk = outcomes.slice(start, start + CHUNK)

    await db.$transaction(
      chunk.map((outcome) =>
        db.task.update({
          where: { id: outcome.id },
          data: {
            status: outcome.status,
            value: outcome.value,
            completedAt: outcome.completedAt,
          },
        })
      )
    )
  }
}

async function simulateHistory(userId: string, today: DayKey): Promise<number> {
  const tasks = await db.task.findMany({
    where: { userId, dueOn: { lt: toDateColumn(today) } },
    select: { id: true, dueOn: true, target: true },
    orderBy: [{ dueOn: 'asc' }, { id: 'asc' }],
  })
  const random = makeRandom(RANDOM_SEED)
  const outcomes = tasks
    .map((task) => decideOutcome(task, today, random))
    .filter((outcome): outcome is Outcome => outcome !== null)

  await applyOutcomes(outcomes)
  return tasks.length
}

/** Guarantee the homepage has a real "you missed this" signal to show. */
async function leaveYesterdayUnfinished(userId: string, today: DayKey): Promise<void> {
  const stragglers = await db.task.findMany({
    where: { userId, dueOn: toDateColumn(shiftDays(today, -1)) },
    select: { id: true },
    take: 2,
  })

  await db.task.updateMany({
    where: { id: { in: stragglers.map((task) => task.id) } },
    data: { status: TaskStatus.PENDING, value: null, completedAt: null },
  })
}

/** Numbers only. The app cannot invent someone's journal, so prose stays empty. */
async function writeJournal(userId: string, from: DayKey, today: DayKey): Promise<number> {
  const random = makeRandom(RANDOM_SEED + 1)
  const rows = daysInRange(from, shiftDays(today, -1))
    .map((day, index) => ({ day, index }))
    .filter(() => random() > 0.12)
    .map(({ day, index }) => ({
      userId,
      entryOn: toDateColumn(day),
      mood: swing(index, random(), 9),
      energy: swing(index, random(), 6),
    }))

  const written = await db.journalEntry.createMany({ data: rows, skipDuplicates: true })
  return written.count
}

/** A gentle wave plus noise, so seeded charts look lived-in rather than flat. */
function swing(index: number, noise: number, period: number): number {
  const wave = 3 + Math.sin(index / period) * 1.2 + (noise - 0.5)

  return Math.min(5, Math.max(1, Math.round(wave)))
}

async function main(): Promise<void> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const today = todayIn(timeZone)
  const thisQuarter = quarterRefOf(today)

  await wipe()

  const user = await db.user.create({ data: { name: 'Leo', timeZone } })

  for (const spec of PAST_SEASONS) {
    await createClosedSeason(user.id, shiftQuarter(thisQuarter, -spec.quartersBack), spec)
  }

  const season = await createSeason(user.id, thisQuarter)
  const startsOn = fromDateColumn(season.startsOn)

  const habitsByTitle = await createHabits(user.id, startsOn)
  await createQuests(user.id, season.id, habitsByTitle)

  const tasks = await materializeTasks(user.id, startsOn, shiftDays(today, 1))
  const past = await simulateHistory(user.id, today)

  await leaveYesterdayUnfinished(user.id, today)

  const entries = await writeJournal(user.id, startsOn, today)

  console.log(`Seeded ${season.name} — day ${daysBetween(startsOn, today) + 1} of the season`)
  console.log(
    `  ${QUESTS.length} quests · ${HABITS.length} habits · ${tasks} tasks · ${past} of them in the past`
  )
  console.log(`  ${entries} journal entries · ${PAST_SEASONS.length} past season(s)`)
  console.log(`  timezone ${timeZone}`)
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await db.$disconnect()
    process.exit(1)
  })
