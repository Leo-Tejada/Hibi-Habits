import { connection } from 'next/server'
import type { Subcategory } from '@/generated/prisma/enums'
import { clampDay, daysBetween, shiftDays, todayIn, type DayKey } from '@/lib/dates/day'
import { seasonMonths } from '@/lib/seasons/calendar'
import { seasonNav } from '@/lib/seasons/nav'
import {
  parseQuarterKey,
  quarterEnd,
  quarterKey,
  quarterLabel,
  quarterRefOf,
  quarterStart,
  type QuarterRef,
} from '@/lib/seasons/quarter'
import { seasonWindow } from '@/lib/seasons/window'
import { CATEGORIES, areaLabel, areasOf } from '@/lib/taxonomy'
import type { AreaCompletion, HomeView, SeasonHeader, Tally } from '@/types/home'
import { currentUser } from '../current-user'
import { areaCompletion, type CompletionTally } from './completion'
import { seasonQuests } from './quests'
import { seasonForQuarter } from './season'
import { collectSignals } from './signals'
import { tallyBetween } from './tally'

/** The window the homepage calls "recent" — a rolling week, ending today. */
const RECENT_DAYS = 7

const NO_TALLY: Tally = { done: 0, pending: 0, total: 0 }

const NOTHING_ASKED: CompletionTally = { done: 0, total: 0 }

type SeasonRow = { id: string; name: string } | null

/**
 * All nine areas, in taxonomy order, whether or not any of them has a
 * habit. The panel is a fixed grid: an area that drops out because it
 * happens to be empty would move the other eight.
 */
function completionRows(counted: Map<Subcategory, CompletionTally>): AreaCompletion[] {
  return CATEGORIES.flatMap((category) =>
    areasOf(category).map((area) => {
      const tally = counted.get(area) ?? NOTHING_ASKED

      return {
        area,
        category,
        label: areaLabel(area),
        done: tally.done,
        total: tally.total,
        share: tally.total > 0 ? tally.done / tally.total : null,
      }
    })
  )
}

function standingOf(ref: QuarterRef, today: DayKey): SeasonHeader['standing'] {
  if (today < quarterStart(ref)) return 'future'
  return today > quarterEnd(ref) ? 'past' : 'current'
}

function headerFor(ref: QuarterRef, row: SeasonRow, today: DayKey): SeasonHeader {
  const startsOn = quarterStart(ref)
  const window = seasonWindow(startsOn, quarterEnd(ref), today)

  return {
    id: row?.id ?? null,
    name: row?.name ?? null,
    quarter: quarterKey(ref),
    label: quarterLabel(ref),
    ...window,
    standing: standingOf(ref, today),
    daysUntilStart: Math.max(0, daysBetween(today, startsOn)),
  }
}

/**
 * Everything the homepage renders.
 *
 * `season` names a quarter, not a moment. Writing up a season at one
 * minute past midnight on the first of the next one still lands on the
 * season you meant, because the URL carries the quarter and the switcher
 * lets you go back to it.
 */
export async function homeView(requested?: string): Promise<HomeView> {
  // What day it is decides the whole page, so it cannot be prerendered.
  await connection()

  const user = await currentUser()
  const today = todayIn(user.timeZone)
  const ref = parseQuarterKey(requested) ?? quarterRefOf(today)
  const row = await seasonForQuarter(user.id, ref)
  const header = headerFor(ref, row, today)
  const weekStart = shiftDays(today, -(RECENT_DAYS - 1))

  // A season still to come has been asked nothing, so there is nothing
  // to count. Otherwise count from its first day up to today, or up to
  // its last day if the season is already over.
  const countedTo = clampDay(today, header.startsOn, header.endsOn)

  const [quests, signals, todayTally, recentTally, counted] = await Promise.all([
    row
      ? seasonQuests(row.id, weekStart, today)
      : Promise.resolve({ main: [], side: [] }),
    collectSignals(user.id, today, header),
    tallyBetween(user.id, today, today),
    tallyBetween(user.id, weekStart, today),
    header.standing === 'future'
      ? Promise.resolve(new Map<Subcategory, CompletionTally>())
      : areaCompletion(user.id, header.startsOn, countedTo),
  ])

  return {
    today,
    userName: user.name,
    nav: seasonNav(ref, today),
    season: header,
    months: seasonMonths(header.startsOn, header.endsOn, today),
    mainQuests: quests.main,
    sideQuests: quests.side,
    signals,
    todayTally: row ? todayTally : NO_TALLY,
    recentTally: row ? recentTally : NO_TALLY,
    areaCompletion: completionRows(counted),
  }
}
