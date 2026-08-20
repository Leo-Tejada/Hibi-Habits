import { formatClock, parseClock, type Minutes } from '@/lib/dates/time'

/**
 * One line of the daily card.
 *
 *   Calisthenics.Push 19:30-20:30
 *   Buy bread 13:40
 *   Wash dishes
 *
 * Only the name is required. A leading `Habit.Task` token links the line
 * to a habit; everything else is a free task that counts toward nothing.
 */
export type ParsedLine = {
  /** The part before the dot, or null when the line is free text. */
  reference: string | null
  /** The part after the dot, or the whole line when there is no reference. */
  name: string
  start: Minutes | null
  end: Minutes | null
}

/**
 * A reference is one unbroken token: letters, digits, dashes and
 * underscores either side of a single dot. Requiring both halves is what
 * keeps ordinary prose safe — "Dr. Smith" has a space after the dot, and
 * "etc." has nothing after it, so neither is mistaken for a link.
 */
const REFERENCE = /^([A-Za-z0-9][\w-]*)\.([A-Za-z0-9][\w-]*)$/

const TRAILING_TIME = /\s+(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?$/

type TimeSpan = { body: string; start: Minutes | null; end: Minutes | null }

/** Peel an `hh:mm` or `hh:mm-hh:mm` off the end, if there is one. */
function splitTime(text: string): TimeSpan {
  const found = TRAILING_TIME.exec(text)

  if (!found) return { body: text, start: null, end: null }

  const start = parseClock(found[1])

  if (start === null) return { body: text, start: null, end: null }
  return { body: text.slice(0, found.index).trim(), start, end: found[2] ? parseClock(found[2]) : null }
}

/** Null for a blank line, so callers can drop them without a special case. */
export function parseLine(raw: string): ParsedLine | null {
  const trimmed = raw.trim()

  if (trimmed === '') return null

  const { body, start, end } = splitTime(trimmed)
  const [head, ...rest] = body.split(/\s+/)
  const linked = REFERENCE.exec(head)

  if (!linked) return { reference: null, name: body, start, end }
  return { reference: linked[1], name: [linked[2], ...rest].join(' '), start, end }
}

/** The inverse: what the editor shows for a task that already exists. */
export function formatLine(line: ParsedLine): string {
  const subject = line.reference
    ? [line.reference, line.name].filter(Boolean).join('.')
    : line.name
  const clock = line.start === null ? '' : ` ${formatClock(line.start)}`
  const closing = line.start !== null && line.end !== null ? `-${formatClock(line.end)}` : ''

  return `${subject}${clock}${closing}`
}
