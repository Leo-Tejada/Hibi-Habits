import { connection } from 'next/server'
import { daysBetween, shiftDays, todayIn, type DayKey } from '@/lib/dates/day'
import { seasonMonths } from '@/lib/seasons/calendar'
import {
  parseQuarterKey,
  quarterEnd,
  quarterKey,
  quarterLabel,
  quarterRefOf,
  quarterStart,
  shiftQuarter,
  type QuarterRef,
} from '@/lib/seasons/quarter'
import { seasonWindow } from '@/lib/seasons/window'
import type { HomeView, SeasonHeader, SeasonNav, Tally } from '@/types/home'
import { currentUser } from '../current-user'
import { seasonQuests } from './quests'
import { seasonForQuarter } from './season'
import { collectSignals } from './signals'
import { tallyBetween } from './tally'

/** The window the homepage calls "recent" — a rolling week, ending today. */
const RECENT_DAYS = 7

const NO_TALLY: Tally = { done: 0, pending: 0, skipped: 0, total: 0 }

type SeasonRow = { id: string; name: string } | null

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

function navFor(ref: QuarterRef, today: DayKey): SeasonNav {
  const current = quarterRefOf(today)

  return {
    quarter: quarterKey(ref),
    label: quarterLabel(ref),
    previous: quarterKey(shiftQuarter(ref, -1)),
    next: quarterKey(shiftQuarter(ref, 1)),
    current: quarterKey(current),
    isCurrent: quarterKey(ref) === quarterKey(current),
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

  const [quests, signals, todayTally, recentTally] = await Promise.all([
    row
      ? seasonQuests(row.id, weekStart, today)
      : Promise.resolve({ main: [], side: [] }),
    collectSignals(user.id, today, header),
    tallyBetween(user.id, today, today),
    tallyBetween(user.id, weekStart, today),
  ])

  return {
    today,
    userName: user.name,
    nav: navFor(ref, today),
    season: header,
    months: seasonMonths(header.startsOn, header.endsOn, today),
    mainQuests: quests.main,
    sideQuests: quests.side,
    signals,
    todayTally: row ? todayTally : NO_TALLY,
    recentTally: row ? recentTally : NO_TALLY,
  }
}
