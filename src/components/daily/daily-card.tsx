'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { longDate } from '@/lib/dates/format'
import { saveDay, setTaskDone } from '@/server/actions/daily'
import type { DailyLine, DailyView } from '@/types/daily'
import { LineEditor, type EditorLine } from './line-editor'
import { TaskRow } from './task-row'

const STANDING_LABEL = {
  yesterday: 'Yesterday',
  today: 'Today',
  tomorrow: 'Tomorrow',
} as const

/**
 * Always ends on an empty line, the way a text editor does. Without it a
 * day whose every line came from a habit would be locked shut, with
 * nowhere to type.
 */
function toEntries(lines: DailyLine[]): EditorLine[] {
  const entries = lines.map((line) => ({ id: line.id, raw: line.raw, locked: line.generated }))

  return [...entries, { id: null, raw: '', locked: false }]
}

function Step({ to, glyph, label }: { to: string | null; glyph: string; label: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      disabled={to === null}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation()
        if (to) router.push(`/daily?day=${to}`)
      }}
      className="rounded-full px-2.5 py-1 text-[18px] leading-none text-ink-faint enabled:hover:text-ink disabled:opacity-25"
    >
      {glyph}
    </button>
  )
}

export function DailyCard({ view }: { view: DailyView }) {
  const router = useRouter()
  const [entries, setEntries] = useState<EditorLine[] | null>(null)
  const [order, setOrder] = useState<DailyLine[] | null>(null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [, startSaving] = useTransition()
  const listRef = useRef<HTMLUListElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const editing = entries !== null

  // Ticking a box answers immediately and tells the server afterwards.
  // Waiting for a round trip to a database in another country is what
  // made this feel broken.
  const lines = (order ?? view.lines).map((line) =>
    line.id in checks ? { ...line, done: checks[line.id] } : line
  )
  const done = lines.filter((line) => line.done).length

  function startEditing(): void {
    setEntries(toEntries(view.lines))
  }

  useDayShortcuts(view, editing, startEditing)
  useDayWheel(headerRef, view, editing)

  function commit(next: EditorLine[]): void {
    setEntries(null)
    startSaving(async () => {
      await saveDay(view.day, next.map(({ id, raw }) => ({ id, raw })))
      // Only here: new lines come back with ids that only the server knows.
      router.refresh()
    })
  }

  function toggle(line: DailyLine, isDone: boolean): void {
    setChecks((previous) => ({ ...previous, [line.id]: isDone }))
    startSaving(() => setTaskDone(line.id, isDone))
  }

  function reorder(next: DailyLine[]): void {
    setOrder(next)
    startSaving(() =>
      saveDay(
        view.day,
        next.map((line) => ({ id: line.id, raw: line.raw }))
      )
    )
  }

  const grab = useRowDrag(listRef, lines, reorder)

  return (
    <Card
      className="w-full max-w-2xl px-8 pt-7 pb-8"
      onClick={() => (editing ? commit(entries) : startEditing())}
    >
      {/*
        A band of its own, so the day can own the scroll wheel without
        fighting the list below it — and so a stray click up here does
        nothing rather than dropping you into the editor.
      */}
      <header
        ref={headerRef}
        title="Scroll to change day"
        onClick={(event) => event.stopPropagation()}
        className="-mx-8 -mt-7 mb-6 flex items-baseline justify-between gap-4 rounded-t-xl border-b border-line bg-well px-8 py-5"
      >
        <div className="flex items-baseline gap-4">
          <h1 className="text-[24px] font-bold leading-none tracking-[-0.02em]">
            {STANDING_LABEL[view.standing]}
          </h1>
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-faint">
            {longDate(view.day)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-3 font-mono text-[14px] tabular-nums text-ink-dim">
            {done}/{lines.length}
          </span>
          <Step to={view.previous} glyph="‹" label="Previous day" />
          <Step to={view.next} glyph="›" label="Next day" />
        </div>
      </header>

      {editing ? (
        <LineEditor
          lines={entries}
          suggestions={view.suggestions}
          references={view.references}
          onChange={setEntries}
          onDone={() => commit(entries)}
        />
      ) : (
        <TaskList
          lines={lines}
          references={view.references}
          listRef={listRef}
          onToggle={toggle}
          onGrab={grab}
        />
      )}

      <p className="pt-7 text-center text-[12px] text-ink-faint">
        {editing ? 'Enter for a new line · Esc to finish' : 'Click the card or press E to edit'}
      </p>
    </Card>
  )
}

function TaskList({
  lines,
  references,
  listRef,
  onToggle,
  onGrab,
}: {
  lines: DailyLine[]
  references: DailyView['references']
  listRef: React.RefObject<HTMLUListElement | null>
  onToggle: (line: DailyLine, done: boolean) => void
  onGrab: (index: number) => (event: React.PointerEvent) => void
}) {
  if (lines.length === 0) {
    return (
      <p className="py-8 text-center text-[14px] text-ink-faint">
        Nothing written for this day. Click to start.
      </p>
    )
  }

  return (
    <ul ref={listRef} className="flex flex-col">
      {lines.map((line, index) => (
        <TaskRow
          key={line.id}
          line={line}
          references={references}
          onToggle={(isDone) => onToggle(line, isDone)}
          onGrab={onGrab(index)}
        />
      ))}
    </ul>
  )
}

/** Arrows move between days; E opens the editor. Only in view mode. */
function useDayShortcuts(view: DailyView, editing: boolean, onEdit: () => void): void {
  const router = useRouter()

  useEffect(() => {
    if (editing) return

    function onKey(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === 'ArrowLeft' && view.previous) router.push(`/daily?day=${view.previous}`)
      if (event.key === 'ArrowRight' && view.next) router.push(`/daily?day=${view.next}`)
      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault()
        onEdit()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, router, onEdit, view.previous, view.next])
}

/** How much wheel travel counts as a deliberate flick. */
const WHEEL_THRESHOLD = 50

/** How long to ignore the wheel afterwards, so momentum cannot run away. */
const WHEEL_COOLDOWN_MS = 400

/**
 * One flick of the wheel over the header moves one day — never three,
 * however hard a trackpad throws it. Travel is accumulated to a threshold
 * and then the wheel is ignored while the momentum dies down.
 */
function useDayWheel(
  ref: React.RefObject<HTMLElement | null>,
  view: DailyView,
  editing: boolean
): void {
  const router = useRouter()

  useEffect(() => {
    const node = ref.current

    if (!node || editing) return

    let travelled = 0
    let cooling = false

    function settle(): void {
      cooling = false
      travelled = 0
    }

    function onWheel(event: WheelEvent): void {
      event.preventDefault()
      if (cooling) return

      travelled += event.deltaY
      if (Math.abs(travelled) < WHEEL_THRESHOLD) return

      const target = travelled > 0 ? view.next : view.previous

      travelled = 0
      if (!target) return

      cooling = true
      window.setTimeout(settle, WHEEL_COOLDOWN_MS)
      router.push(`/daily?day=${target}`)
    }

    // Not passive: the page must not scroll while the header is steering.
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [ref, router, editing, view.next, view.previous])
}

/**
 * Pointer-based reordering, so it works with a finger as well as a mouse.
 * The list is reordered locally as you move and written once on release —
 * nothing waits on the network while you are still dragging.
 */
function useRowDrag(
  listRef: React.RefObject<HTMLUListElement | null>,
  lines: DailyLine[],
  onDrop: (next: DailyLine[]) => void
) {
  return (index: number) => (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const rows = [...(listRef.current?.children ?? [])].map((row) => row.getBoundingClientRect())
    let target = index

    function onMove(move: PointerEvent): void {
      const found = rows.findIndex((row) => move.clientY < row.bottom)

      target = found === -1 ? rows.length - 1 : found
    }

    function onUp(): void {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      if (target === index) return

      const next = [...lines]
      const [moved] = next.splice(index, 1)

      next.splice(target, 0, moved)
      onDrop(next)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
}
