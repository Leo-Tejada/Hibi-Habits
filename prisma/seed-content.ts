import { QuestKind, ScheduleKind, Subcategory } from '../src/generated/prisma/enums'

export type HabitSpec = {
  title: string
  scheduleKind: ScheduleKind
  weekdays?: number[]
  intervalDays?: number
  /** Names cycled across occurrences: Monday Push, Thursday Pull. */
  rotation?: string[]
  startMinute?: number
  endMinute?: number
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

/** Minutes past midnight, written the way a clock reads. */
function at(hours: number, minutes = 0): number {
  return hours * 60 + minutes
}

function weekly(weekdays: number[], extra: Partial<HabitSpec> = {}): Partial<HabitSpec> {
  return { scheduleKind: ScheduleKind.WEEKLY_DAYS, weekdays, ...extra }
}

function everyNDays(intervalDays: number, extra: Partial<HabitSpec> = {}): Partial<HabitSpec> {
  return { scheduleKind: ScheduleKind.EVERY_N_DAYS, intervalDays, ...extra }
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
      {
        title: 'Calisthenics',
        ...weekly([1, 4]),
        rotation: ['Push', 'Pull'],
        startMinute: at(19, 30),
        endMinute: at(20, 30),
        unit: 'reps',
        target: 60,
      } as HabitSpec,
      {
        title: 'Handstand',
        ...weekly([1, 3, 5]),
        rotation: ['Wall-hold', 'Freestanding'],
        startMinute: at(18, 30),
        endMinute: at(19),
        unit: 'sec',
        target: 60,
      } as HabitSpec,
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
      {
        title: 'Sunday lunch',
        ...weekly([0]),
        startMinute: at(14),
        endMinute: at(15, 30),
      } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.MAIN,
    area: Subcategory.GROWTH,
    title: 'Ship Hibi Habits',
    intent: 'Five screens, used every day by at least one person: me.',
    progress: 30,
    habits: [
      {
        title: 'Hibi',
        ...weekly([1, 2, 3, 4, 5]),
        rotation: ['Build', 'Polish'],
        startMinute: at(9),
        endMinute: at(10, 30),
        unit: 'min',
        target: 90,
      } as HabitSpec,
      { title: 'Ship-something', ...weekly([5]) } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.MIND,
    title: 'Read six books',
    intent: 'Two a month. Finished, not started.',
    progress: 55,
    habits: [
      {
        title: 'Read',
        ...weekly(EVERY_DAY),
        startMinute: at(22),
        unit: 'pages',
        target: 20,
      } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.SPIRIT,
    title: 'Sit every morning',
    intent: 'Ten minutes before touching the phone.',
    progress: 62,
    habits: [
      {
        title: 'Sit',
        ...weekly(EVERY_DAY),
        startMinute: at(7),
        endMinute: at(7, 10),
        unit: 'min',
        target: 10,
      } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.MONEY,
    title: 'Three months of runway',
    intent: 'Save until the buffer covers a whole season.',
    progress: 40,
    habits: [
      { title: 'Spending', ...weekly(EVERY_DAY), startMinute: at(21, 30) } as HabitSpec,
    ],
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.FRIENDS,
    title: 'See people in person',
    intent: 'One friend, face to face, every fortnight.',
    progress: 25,
    habits: [{ title: 'Reach-out', ...everyNDays(14) } as HabitSpec],
  },
]

/** Habits that belong to no quest — proof that the pyramid is optional. */
export const LOOSE_HABITS: { area: Subcategory; habit: HabitSpec }[] = [
  {
    area: Subcategory.BODY,
    habit: { title: 'Stretch', ...weekly(EVERY_DAY), startMinute: at(23) } as HabitSpec,
  },
  {
    area: Subcategory.GROWTH,
    habit: {
      title: 'MathsIII',
      ...weekly([2, 4]),
      rotation: ['Matlab-practice', 'Problem-set'],
      startMinute: at(11),
      endMinute: at(13),
    } as HabitSpec,
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
