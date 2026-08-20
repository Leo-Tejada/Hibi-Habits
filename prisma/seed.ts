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
import { LOOSE_HABITS, PAST_QUESTS, PAST_REFLECTION, QUESTS } from './seed-content'

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

async function createQuests(userId: string, seasonId: string, anchorOn: DayKey): Promise<void> {
  for (const [index, spec] of QUESTS.entries()) {
    await db.quest.create({
      data: {
        userId,
        seasonId,
        kind: spec.kind,
        subcategory: spec.area,
        title: spec.title,
        intent: spec.intent,
        progress: spec.progress,
        status: QuestStatus.ACTIVE,
        sortOrder: index,
        habits: {
          create: spec.habits.map((habit) => ({
            userId,
            subcategory: spec.area,
            title: habit.title,
            scheduleKind: habit.scheduleKind,
            weekdays: habit.weekdays ?? [],
            intervalDays: habit.intervalDays ?? null,
            anchorOn: toDateColumn(anchorOn),
            unit: habit.unit ?? null,
            target: habit.target ?? null,
          })),
        },
      },
    })
  }
}

/** The quarter before this one: closed, reflected on, and left alone. */
async function createClosedSeason(userId: string, ref: QuarterRef): Promise<void> {
  const season = await createSeason(userId, ref)

  for (const [index, spec] of PAST_QUESTS.entries()) {
    await db.quest.create({
      data: {
        userId,
        seasonId: season.id,
        kind: spec.kind,
        subcategory: spec.area,
        title: spec.title,
        intent: spec.intent,
        progress: spec.progress,
        status: spec.progress >= 60 ? QuestStatus.COMPLETED : QuestStatus.ABANDONED,
        sortOrder: index,
      },
    })
  }

  await db.seasonReflection.create({
    data: {
      seasonId: season.id,
      wentWell: PAST_REFLECTION.wentWell,
      wentBadly: PAST_REFLECTION.wentBadly,
      learned: PAST_REFLECTION.learned,
      carryForward: PAST_REFLECTION.carryForward,
      completedAt: new Date(`${quarterEnd(ref)}T20:00:00.000Z`),
      ratings: {
        create: PAST_REFLECTION.ratings.map((rating) => ({
          subcategory: rating.area,
          score: rating.score,
        })),
      },
    },
  })
}

async function createLooseHabits(userId: string, anchorOn: DayKey): Promise<void> {
  for (const { area, habit } of LOOSE_HABITS) {
    await db.habit.create({
      data: {
        userId,
        questId: null,
        subcategory: area,
        title: habit.title,
        scheduleKind: habit.scheduleKind,
        weekdays: habit.weekdays ?? [],
        intervalDays: habit.intervalDays ?? null,
        anchorOn: toDateColumn(anchorOn),
        unit: habit.unit ?? null,
        target: habit.target ?? null,
      },
    })
  }
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
  if (roll < doneChance + 0.07) {
    return { id: task.id, status: TaskStatus.SKIPPED, value: null, completedAt: null }
  }
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

  await createClosedSeason(user.id, shiftQuarter(thisQuarter, -1))

  const season = await createSeason(user.id, thisQuarter)
  const startsOn = fromDateColumn(season.startsOn)

  await createQuests(user.id, season.id, startsOn)
  await createLooseHabits(user.id, startsOn)

  const tasks = await materializeTasks(user.id, startsOn, today)
  const past = await simulateHistory(user.id, today)

  await leaveYesterdayUnfinished(user.id, today)

  const entries = await writeJournal(user.id, startsOn, today)

  console.log(`Seeded ${season.name} — day ${daysBetween(startsOn, today) + 1} of the season`)
  console.log(`  ${QUESTS.length} quests · ${tasks} tasks · ${past} of them in the past`)
  console.log(`  ${entries} journal entries · previous quarter closed with a reflection`)
  console.log(`  timezone ${timeZone}`)
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await db.$disconnect()
    process.exit(1)
  })
