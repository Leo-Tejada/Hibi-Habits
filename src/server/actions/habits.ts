'use server'

import { revalidatePath } from 'next/cache'
import { QuestKind, ScheduleKind, Subcategory } from '@/generated/prisma/enums'
import { toDateColumn, todayIn } from '@/lib/dates/day'
import { quarterEnd, quarterLabel, quarterRefOf, quarterStart } from '@/lib/seasons/quarter'
import { currentUser } from '../current-user'
import { db } from '../db'

/** Longer than this and the node stops being a label and starts being a sentence. */
const MAX_TITLE = 60

/** The area arrives from the client, so it is checked against the enum, not trusted. */
function asSubcategory(value: string): Subcategory | null {
  return Object.hasOwn(Subcategory, value) ? (value as Subcategory) : null
}

/**
 * Create a habit from nothing but a name.
 *
 * It is born with a weekly schedule and no weekdays in it, which is a
 * schedule that wants no day at all — `wantsDay` finds nothing in an
 * empty list. So a habit exists on the graph the moment you name it and
 * still writes nothing into your daily page until you give it days.
 * Naming a thing and committing to it are separate acts.
 */
export async function createHabit(area: string, title: string): Promise<void> {
  const subcategory = asSubcategory(area)
  const name = title.trim().slice(0, MAX_TITLE)

  if (!subcategory || name.length === 0) return

  const user = await currentUser()

  await db.habit.create({
    data: {
      userId: user.id,
      subcategory,
      title: name,
      scheduleKind: ScheduleKind.WEEKLY_DAYS,
      weekdays: [],
      anchorOn: toDateColumn(todayIn(user.timeZone)),
    },
  })

  revalidatePath('/habits')
}

/**
 * Create a side quest from nothing but a name, in the season the day
 * belongs to.
 *
 * A quest needs a season row and a quarter has none until something
 * makes one, so this makes it. Opening the season silently is safe in a
 * way it would not be for most records: a season is a calendar quarter,
 * so there is exactly one it could be and no information is being
 * invented by writing it down. The alternative — a `+` that is disabled
 * until you have visited some other screen — punishes you for the order
 * you happened to do things in.
 *
 * With `habitId` the quest is hung off the habit that serves it and
 * takes that habit's area; without one it is a loose quest and `area`
 * decides where it lives.
 *
 * Only SIDE quests are made here. A main quest is one of the three
 * anchors of a season and is set deliberately at the start of one, which
 * is a different act with a different rule attached — see
 * `canAddMainQuest` in `src/lib/quests/rules.ts`.
 */
export async function createSideQuest(
  area: string,
  title: string,
  habitId?: string
): Promise<void> {
  const name = title.trim().slice(0, MAX_TITLE)

  if (name.length === 0) return

  const user = await currentUser()
  const season = await openSeason(user.id, user.timeZone)

  let servingHabitId: string | null = null
  let subcategory: Subcategory | null = null

  if (habitId) {
    const habit = await db.habit.findFirst({
      where: { id: habitId, userId: user.id },
      select: { id: true },
    })

    if (!habit) return
    servingHabitId = habit.id
  } else {
    subcategory = asSubcategory(area)
    if (!subcategory) return
  }

  await db.quest.create({
    data: {
      userId: user.id,
      seasonId: season.id,
      kind: QuestKind.SIDE,
      habitId: servingHabitId,
      subcategory,
      title: name,
    },
  })

  revalidatePath('/habits')
}

/**
 * The season the given zone is currently in, created if it is not there.
 *
 * `upsert` rather than a find-then-create, so two quests named at once
 * cannot race into two seasons — the unique index on `(userId, startsOn)`
 * is what actually settles it.
 */
async function openSeason(userId: string, timeZone: string) {
  const quarter = quarterRefOf(todayIn(timeZone))
  const startsOn = toDateColumn(quarterStart(quarter))

  return db.season.upsert({
    where: { userId_startsOn: { userId, startsOn } },
    update: {},
    create: {
      userId,
      name: quarterLabel(quarter),
      startsOn,
      endsOn: toDateColumn(quarterEnd(quarter)),
    },
  })
}
