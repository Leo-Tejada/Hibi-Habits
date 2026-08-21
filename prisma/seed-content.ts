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
  title: string
  intent?: string
  progress: number
  /** For a loose quest: the area it lives in. */
  area?: Subcategory
  /** For a served quest: the title of the habit that earns it — the
   *  quest then takes that habit's area. */
  habitTitle?: string
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

/** Minutes past midnight, written the way a clock reads. */
function at(hours: number, minutes = 0): number {
  return hours * 60 + minutes
}

function weekly(weekdays: number[], extra: Partial<HabitSpec> = {}): Partial<HabitSpec> {
  return { scheduleKind: ScheduleKind.WEEKLY_DAYS, weekdays, ...extra }
}

/**
 * The practices of this season, in the areas they serve. A habit with no
 * weekdays wants no day: it never generates a task, it only suggests
 * itself while a day is being written (see `vocabularyFor` in
 * `src/server/queries/daily.ts`).
 */
export const HABITS: { area: Subcategory; habit: HabitSpec }[] = [
  {
    area: Subcategory.BODY,
    habit: {
      title: 'Calisthenics',
      ...weekly([1, 2, 4]),
      rotation: ['Push', 'Legs/Core', 'Pull'],
      startMinute: at(8, 30),
      endMinute: at(9, 30),
    } as HabitSpec,
  },
  {
    area: Subcategory.BODY,
    habit: {
      title: 'Swimming',
      ...weekly([3, 5]),
      startMinute: at(8),
      endMinute: at(9),
    } as HabitSpec,
  },
  {
    area: Subcategory.MIND,
    habit: { title: 'Journaling', ...weekly(EVERY_DAY), unit: 'effort', target: 3 } as HabitSpec,
  },
  {
    area: Subcategory.BODY,
    habit: {
      title: 'Yoga',
      ...weekly([0, 1, 2, 4, 6]),
      startMinute: at(7, 50),
      endMinute: at(8, 5),
      unit: 'effort',
    } as HabitSpec,
  },
  {
    area: Subcategory.MIND,
    habit: { title: 'Reading', ...weekly(EVERY_DAY), unit: 'pages' } as HabitSpec,
  },
  {
    area: Subcategory.BODY,
    habit: {
      title: 'Cold shower',
      ...weekly(EVERY_DAY),
      startMinute: at(9, 30),
      endMinute: at(9, 50),
    } as HabitSpec,
  },
  {
    area: Subcategory.BODY,
    habit: { title: 'Sport-Snacking', ...weekly([]), unit: 'effort' } as HabitSpec,
  },
  {
    area: Subcategory.SPIRIT,
    habit: { title: 'Meditating', ...weekly([]), unit: 'min' } as HabitSpec,
  },
  {
    area: Subcategory.BODY,
    habit: { title: 'Cooking', ...weekly([]), unit: 'taste' } as HabitSpec,
  },
  {
    area: Subcategory.BODY,
    habit: { title: 'Walking', ...weekly([]), unit: 'km' } as HabitSpec,
  },
  {
    area: Subcategory.BODY,
    habit: { title: 'Cycling', ...weekly([]), unit: 'km' } as HabitSpec,
  },
  {
    area: Subcategory.WORK,
    habit: {
      title: 'OpsHub devving',
      ...weekly([1, 2, 3, 4, 5]),
      startMinute: at(10),
      endMinute: at(14),
      unit: 'effort',
    } as HabitSpec,
  },
]

/**
 * The quests of the current season. Two mains — Health and Independence
 * — and no Relationships anchor yet: the vacancy is a decision, not an
 * oversight.
 */
export const QUESTS: QuestSpec[] = [
  {
    kind: QuestKind.MAIN,
    area: Subcategory.MIND,
    title: '1 Month of 0 SNS',
    progress: 100,
  },
  {
    kind: QuestKind.MAIN,
    habitTitle: 'OpsHub devving',
    title: 'Project A MVP',
    progress: 100,
  },
  { kind: QuestKind.SIDE, area: Subcategory.MONEY, title: 'Finish IVI', progress: 40 },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.MONEY,
    title: 'Save 1 000€ for a new bike',
    progress: 20,
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.SPIRIT,
    title: 'Go to Puerto de Sagunto',
    progress: 0,
  },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.WORK,
    title: 'Make Hibi Habits a Web-App',
    progress: 20,
  },
  { kind: QuestKind.SIDE, area: Subcategory.WORK, title: 'Learn to Vibe-Code', progress: 10 },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.GROWTH,
    title: "Get accepted in 42's cursus",
    progress: 0,
  },
  { kind: QuestKind.SIDE, area: Subcategory.FAMILY, title: 'Take Mum & Rosa out', progress: 0 },
  {
    kind: QuestKind.SIDE,
    area: Subcategory.FAMILY,
    title: 'Spend more time w/ Rosa',
    progress: 40,
  },
  { kind: QuestKind.SIDE, area: Subcategory.LOVE, title: 'Stay single', progress: 0 },
  { kind: QuestKind.SIDE, habitTitle: 'Calisthenics', title: 'Get crazy grip', progress: 40 },
]

export type PastQuestSpec = {
  kind: QuestKind
  area: Subcategory
  title: string
  intent?: string
  progress: number
}

export type PastSeasonSpec = {
  /** How many quarters before the current one this season was. 1 = the
   *  quarter just closed, 2 = the one before that, and so on. */
  quartersBack: number
  quests: PastQuestSpec[]
  reflection: {
    wentWell?: string
    wentBadly?: string
    learned?: string
    carryForward?: string
    ratings: { area: Subcategory; score: number }[]
  }
}

/**
 * Seasons that have already closed, in any order. Written from real life
 * in MY_DATA.md; Jan–Mar and Apr–Jun 2026 are still to come.
 */
export const PAST_SEASONS: PastSeasonSpec[] = []
