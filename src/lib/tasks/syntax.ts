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

/**
 * Colour classes for one line. Everything is a token so the pieces can be
 * painted separately — and so an editor overlay can sit exactly on top of
 * a monospaced input, character for character.
 */
export type TokenKind = 'reference' | 'head' | 'name' | 'punct' | 'number' | 'plain'

export type Token = { text: string; kind: TokenKind }

function pushText(tokens: Token[], text: string, kind: TokenKind): void {
  if (text !== '') tokens.push({ text, kind })
}

/** Digits are figures, ':' and '-' are punctuation, spaces are neither. */
function tokenizeTime(tokens: Token[], tail: string): void {
  const lead = /^\s*/.exec(tail)?.[0] ?? ''

  pushText(tokens, lead, 'plain')

  for (const piece of tail.slice(lead.length).split(/([:-])/)) {
    pushText(tokens, piece, /^[:-]$/.test(piece) ? 'punct' : 'number')
  }
}

/** The concatenated token text always equals the input, exactly. */
export function tokenizeLine(raw: string): Token[] {
  const tokens: Token[] = []
  const timed = TRAILING_TIME.exec(raw)
  const body = raw.slice(0, timed ? timed.index : raw.length)
  const lead = /^\s*/.exec(body)?.[0] ?? ''
  const rest = body.slice(lead.length)
  const breakAt = rest.search(/\s/)
  const head = breakAt === -1 ? rest : rest.slice(0, breakAt)
  const linked = REFERENCE.exec(head)

  pushText(tokens, lead, 'plain')

  if (linked) {
    pushText(tokens, linked[1], 'reference')
    pushText(tokens, '.', 'punct')
    pushText(tokens, linked[2], 'name')
    pushText(tokens, breakAt === -1 ? '' : rest.slice(breakAt), 'name')
  } else {
    // No dot, so this may still be a habit with no task part — "Sit". The
    // first word is set apart as `head` and whoever knows the habit names
    // decides whether it is a reference or just a word.
    pushText(tokens, head, 'head')
    pushText(tokens, breakAt === -1 ? '' : rest.slice(breakAt), 'name')
  }

  if (timed) tokenizeTime(tokens, raw.slice(timed.index))
  return tokens
}

/** The line without its trailing time, for views that show the clock separately. */
export function subjectOf(raw: string): string {
  const timed = TRAILING_TIME.exec(raw)

  return timed ? raw.slice(0, timed.index) : raw
}
