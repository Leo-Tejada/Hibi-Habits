'use client'

import { formatClock } from '@/lib/dates/time'
import type { DailyLine } from '@/types/daily'

function Clock({ line }: { line: DailyLine }) {
  if (line.start === null) return null

  const span = line.end === null ? '' : `–${formatClock(line.end)}`

  return (
    <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-faint">
      {formatClock(line.start)}
      {span}
    </span>
  )
}

/** The reference is underlined, which is what says "this counts for something". */
function Subject({ line }: { line: DailyLine }) {
  const struck = line.done ? 'line-through' : ''

  if (!line.reference && !line.unresolved) {
    return <span className={`truncate ${struck}`}>{line.name}</span>
  }

  return (
    <span className={`truncate ${struck}`}>
      <span
        title={line.unresolved ? 'Written like a link, but no habit by that name' : undefined}
        className={
          line.unresolved
            ? 'text-alert underline decoration-wavy underline-offset-4'
            : 'text-ink-dim underline decoration-dotted underline-offset-4'
        }
      >
        {line.reference}
      </span>
      {line.name && <span className="text-ink-faint">.</span>}
      {line.name}
    </span>
  )
}

export function TaskRow({
  line,
  onToggle,
  onGrab,
}: {
  line: DailyLine
  onToggle: (done: boolean) => void
  onGrab: (event: React.PointerEvent) => void
}) {
  const locked = line.settled && !line.done
  const draggable = line.start === null

  return (
    <li
      className={`group flex items-center gap-3 rounded-md px-2 py-1.5 ${
        line.happeningNow ? 'bg-well ring-1 ring-inset ring-line' : ''
      } ${locked ? 'opacity-45' : ''}`}
    >
      <input
        type="checkbox"
        checked={line.done}
        disabled={line.settled}
        aria-label={line.name}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onToggle(event.target.checked)}
        className="size-3.5 shrink-0 cursor-pointer appearance-none rounded-[3px] border border-line-soft bg-ground checked:border-ink checked:bg-ink disabled:cursor-not-allowed"
      />

      <span className={`min-w-0 flex-1 text-[13px] ${line.done ? 'text-ink-faint' : 'text-ink'}`}>
        <Subject line={line} />
      </span>

      <Clock line={line} />

      <span
        onPointerDown={draggable ? onGrab : undefined}
        onClick={(event) => event.stopPropagation()}
        aria-hidden
        className={`w-3 shrink-0 text-center font-mono text-[11px] leading-none ${
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
