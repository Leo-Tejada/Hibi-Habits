/** A clock time as minutes past midnight. 19:30 is 1170. */
export type Minutes = number

export const MINUTES_IN_DAY = 24 * 60

const CLOCK = /^(\d{1,2}):(\d{2})$/

/** '19:30' to 1170. Null for anything that is not a real time of day. */
export function parseClock(text: string): Minutes | null {
  const found = CLOCK.exec(text.trim())

  if (!found) return null

  const hours = Number(found[1])
  const minutes = Number(found[2])

  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function formatClock(value: Minutes): string {
  const hours = Math.floor(value / 60)
  const minutes = value % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** What time it is where the user is, as minutes past their midnight. */
export function nowMinutesIn(timeZone: string): Minutes {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  return parseClock(parts) ?? 0
}
