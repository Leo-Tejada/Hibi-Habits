'use server'

import { revalidatePath } from 'next/cache'
import { ScheduleKind, Subcategory } from '@/generated/prisma/enums'
import { toDateColumn, todayIn } from '@/lib/dates/day'
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
