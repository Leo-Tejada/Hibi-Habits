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
      className={`group flex items-center gap-4 rounded-lg ${LINE_PAD} ${
        line.happeningNow ? 'bg-well ring-1 ring-inset ring-line' : ''
      } ${locked ? 'opacity-45' : ''}`}
    >
      <input
        type="checkbox"
        checked={line.done}
        disabled={line.settled}
        aria-label={line.raw}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onToggle(event.target.checked)}
        className="size-4 shrink-0 cursor-pointer appearance-none rounded border border-line-soft bg-ground checked:border-ink checked:bg-ink disabled:cursor-not-allowed"
      />

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
