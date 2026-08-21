'use client'

import { formatClock } from '@/lib/dates/time'
import { subjectOf } from '@/lib/tasks/syntax'
import type { DailyLine } from '@/types/daily'
import { LINE_PAD } from './line-metrics'
import { ClockText, TaskText, type References } from './task-text'

function Clock({ line }: { line: DailyLine }) {
  if (line.start === null) return <span aria-hidden className="w-24 shrink-0" />

  const span = line.end === null ? '' : `–${formatClock(line.end)}`

  return (
    <span className="w-24 shrink-0 text-right font-mono text-[13px] tabular-nums">
      <ClockText text={`${formatClock(line.start)}${span}`} />
    </span>
  )
}

export function TaskRow({
  line,
  references,
  onToggle,
  onGrab,
}: {
  line: DailyLine
  references: References
  onToggle: (done: boolean) => void
  onGrab: (event: React.PointerEvent) => void
}) {
  const locked = line.settled && !line.done
  const draggable = line.start === null

  return (
    <li
      className={`group flex items-center gap-4 ${LINE_PAD} ${
        line.happeningNow ? 'bg-well ring-1 ring-inset ring-line' : ''
      } ${locked ? 'opacity-45' : ''}`}
    >
      {/*
        The box is small because a large one would shout, but the target
        is not: an invisible pad reaches well past it on every side, and
        being inside the label means a click anywhere on it still ticks.
      */}
      <label
        onClick={(event) => event.stopPropagation()}
        className={`relative flex shrink-0 items-center ${
          line.settled ? '' : 'cursor-pointer'
        }`}
      >
        <input
          type="checkbox"
          checked={line.done}
          disabled={line.settled}
          aria-label={line.raw}
          onChange={(event) => onToggle(event.target.checked)}
          className="size-4 appearance-none border border-line-soft bg-ground checked:border-ink checked:bg-ink disabled:cursor-not-allowed"
        />
        {/*
          Ten, not twelve: rows sit 20px apart, so this covers the whole
          gap and meets its neighbour exactly at the midpoint. Any more
          and the pads would overlap, and a click between two rows would
          tick whichever happened to be painted last.
        */}
        <span aria-hidden className="absolute -inset-2.5" />
      </label>

      <TaskText
        raw={subjectOf(line.raw)}
        references={references}
        className={`min-w-0 flex-1 truncate text-[16px] leading-7 ${
          line.done ? 'text-ink-faint line-through' : 'text-ink'
        }`}
      />

      <Clock line={line} />

      <span
        onPointerDown={draggable ? onGrab : undefined}
        onClick={(event) => event.stopPropagation()}
        aria-hidden
        className={`w-3 shrink-0 text-center font-mono text-[13px] leading-none ${
          draggable
            ? 'cursor-grab text-ink-faint opacity-0 group-hover:opacity-100'
            : 'text-transparent'
        }`}
      >
        ⠿
      </span>
    </li>
  )
}
