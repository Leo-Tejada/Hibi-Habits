import { longDate } from '@/lib/dates/format'
import {
  WEEKDAY_INITIALS,
  type CalendarCell,
  type CalendarDay,
  type CalendarMonth,
} from '@/lib/seasons/calendar'
import { Eyebrow } from '../ui/eyebrow'

const SQUARE: Record<CalendarDay['state'], string> = {
  past: 'border-line bg-well',
  today: 'border-ink',
  future: 'border-line-soft',
}

const NUMERAL: Record<CalendarDay['state'], string> = {
  past: 'text-ink-dim',
  today: 'text-ink',
  future: 'text-ink-faint',
}

/**
 * One day. The square is deliberately empty: it is being held for the
 * hours logged at the office, which arrive from the NFC reader later.
 */
function DaySquare({ cell }: { cell: CalendarCell }) {
  if (!cell) return <div aria-hidden className="aspect-square" />

  return (
    <div
      title={longDate(cell.day)}
      className={`relative aspect-square border ${SQUARE[cell.state]}`}
    >
      <span
        className={`absolute left-1 top-0.5 font-mono text-[9px] tabular-nums leading-tight ${NUMERAL[cell.state]}`}
      >
        {cell.dayOfMonth}
      </span>
    </div>
  )
}

function MonthGrid({ month }: { month: CalendarMonth }) {
  return (
    <div className="min-w-0">
      <Eyebrow className="text-ink-dim">{month.label}</Eyebrow>

      <div className="mt-2.5 grid grid-cols-7 gap-1">
        {WEEKDAY_INITIALS.map((initial, column) => (
          <span
            key={`${initial}-${column}`}
            aria-hidden
            className="pb-0.5 text-center font-mono text-[9px] uppercase leading-none text-ink-dim"
          >
            {initial}
          </span>
        ))}

        {month.weeks.flatMap((week, weekIndex) =>
          week.map((cell, column) => (
            <DaySquare key={cell?.day ?? `blank-${weekIndex}-${column}`} cell={cell} />
          ))
        )}
      </div>
    </div>
  )
}

/**
 * The season as three ordinary month calendars, Monday first.
 *
 * Width is capped so the squares stay around the size of a two-figure
 * reading — they are being held for logged office hours, not for a wall
 * planner, and the quests below should still be on screen.
 */
export function SeasonCalendar({ months }: { months: CalendarMonth[] }) {
  return (
    <div className="grid max-w-[56rem] gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((month) => (
        <MonthGrid key={month.key} month={month} />
      ))}
    </div>
  )
}
