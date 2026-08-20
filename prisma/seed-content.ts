import { QuestKind, ScheduleKind, Subcategory } from '../src/generated/prisma/enums'

export type HabitSpec = {
  title: string
  scheduleKind: ScheduleKind
  weekdays?: number[]
  intervalDays?: number
  unit?: string
  target?: number
}

export type QuestSpec = {
  kind: QuestKind
  area: Subcategory
  title: string
  intent: string
  progress: number
  habits: HabitSpec[]
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

function weekly(weekdays: number[], extra: Partial<HabitSpec> = {}): Partial<HabitSpec> {
  return { scheduleKind: ScheduleKind.WEEKLY_DAYS, weekdays, ...extra }
}

function everyNDays(intervalDays: number): Partial<HabitSpec> {
  return { scheduleKind: ScheduleKind.EVERY_N_DAYS, intervalDays }
}

/** One main quest per category, then as many side quests as wanted. */
export const QUESTS: QuestSpec[] = [
  {
    kind: QuestKind.MAIN,
    area: Subcategory.BODY,
    title: 'Learn the handstand',
    intent: 'Freestanding, ten seconds, before the season closes.',
    progress: 45,
    habits: [
      { title: 'Calisthenics · push', ...weekly([1, 4]), unit: 'reps', target: 60 } as HabitSpec,
      { title: 'Wall handstand hold', ...weekly([1, 3, 5]), unit: 'sec', target: 60 } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.MAIN,
    area: Subcategory.FAMILY,
    title: 'Be someone my family hears from',
    intent: 'A real call every week, and Sunday lunch with the phone face down.',
    progress: 70,
    habits: [
      { title: 'Call home', ...everyNDays(7) } as HabitSpec,
      { title: 'Sunday lunch, phone away', ...weekly([0]) } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.MAIN,
    area: Subcategory.GROWTH,
    title: 'Ship Hibi Habits',
    intent: 'Five screens, used every day by at least one person: me.',
    progress: 30,
    habits: [
      { title: 'Write code', ...weekly([1, 2, 3, 4, 5]), unit: 'min', target: 90 } as HabitSpec,
      { title: 'Ship something visible', ...weekly([5]) } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.MIND,
    title: 'Read six books',
    intent: 'Two a month. Finished, not started.',
    progress: 55,
    habits: [{ title: 'Read', ...weekly(EVERY_DAY), unit: 'pages', target: 20 } as HabitSpec],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.SPIRIT,
    title: 'Sit every morning',
    intent: 'Ten minutes before touching the phone.',
    progress: 62,
    habits: [{ title: 'Morning sit', ...weekly(EVERY_DAY), unit: 'min', target: 10 } as HabitSpec],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.MONEY,
    title: 'Three months of runway',
    intent: 'Save until the buffer covers a whole season.',
    progress: 40,
    habits: [{ title: "Log the day's spending", ...weekly(EVERY_DAY) } as HabitSpec],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.FRIENDS,
    title: 'See people in person',
    intent: 'One friend, face to face, every fortnight.',
    progress: 25,
    habits: [{ title: 'Reach out to a friend', ...everyNDays(14) } as HabitSpec],
  },
]

/** Habits that belong to no quest — proof that the pyramid is optional. */
export const LOOSE_HABITS: { area: Subcategory; habit: HabitSpec }[] = [
  {
    area: Subcategory.BODY,
    habit: { title: 'Stretch before bed', ...weekly(EVERY_DAY) } as HabitSpec,
  },
]

/**
 * A season that has already closed, so the season switcher has somewhere
 * to go and the reflection model gets exercised.
 */
export const PAST_QUESTS: {
  kind: QuestKind
  area: Subcategory
  title: string
  intent: string
  progress: number
}[] = [
  {
    kind: QuestKind.MAIN,
    area: Subcategory.SPIRIT,
    title: 'Put the phone down',
    intent: 'No screen for the first hour of the day.',
    progress: 80,
  },
  {
    kind: QuestKind.MAIN,
    area: Subcategory.LOVE,
    title: 'One evening a week that is ours',
    intent: 'Booked in advance, and not cancelled.',
    progress: 65,
  },
  {
    kind: QuestKind.MAIN,
    area: Subcategory.WORK,
    title: 'Leave the office at seven',
    intent: 'Every day. The work will still be there.',
    progress: 40,
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.MIND,
    title: 'Finish the Rust book',
    intent: 'All of it, not the first four chapters again.',
    progress: 30,
  },
]

export const PAST_REFLECTION = {
  wentWell: 'The morning hour without a screen stuck. It is now just what I do.',
  wentBadly: 'Leaving at seven never became real. Two good weeks, then back to eight thirty.',
  learned: 'Quests that depend on other people moving are not really mine to finish.',
  carryForward: 'Keep the mornings. Drop the office-hours quest and make it a habit instead.',
  ratings: [
    { area: Subcategory.SPIRIT, score: 5 },
    { area: Subcategory.LOVE, score: 4 },
    { area: Subcategory.WORK, score: 2 },
    { area: Subcategory.MIND, score: 3 },
  ],
}
