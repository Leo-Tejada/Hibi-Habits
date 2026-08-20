import { toDateColumn } from '@/lib/dates/day'
import { quarterStart, type QuarterRef } from '@/lib/seasons/quarter'
import { db } from '../db'

/**
 * The Season row for a quarter, or null when nobody has opened that
 * quarter yet. A quarter always exists as a span of days; a season is
 * the record of what you meant to do with it.
 */
export async function seasonForQuarter(userId: string, ref: QuarterRef) {
  return db.season.findUnique({
    where: { userId_startsOn: { userId, startsOn: toDateColumn(quarterStart(ref)) } },
  })
}
