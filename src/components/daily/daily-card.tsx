'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
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
      className="rounded-full px-2 py-0.5 text-[13px] leading-none text-ink-faint enabled:hover:text-ink disabled:opacity-30"
    >
      {glyph}
    </button>
  )
}

export function DailyCard({ view }: { view: DailyView }) {
  const router = useRouter()
  const [entries, setEntries] = useState<EditorLine[] | null>(null)
  const [order, setOrder] = useState<DailyLine[] | null>(null)
  const [saving, startSaving] = useTransition()
  const listRef = useRef<HTMLUListElement>(null)

  const editing = entries !== null
  const lines = order ?? view.lines

  useDayShortcuts(view, editing)

  function commit(next: EditorLine[]): void {
    setEntries(null)
    startSaving(async () => {
      await saveDay(view.day, next.map(({ id, raw }) => ({ id, raw })))
      router.refresh()
    })
  }

  function toggle(line: DailyLine, done: boolean): void {
    startSaving(async () => {
      await setTaskDone(line.id, done)
      router.refresh()
    })
  }

  function reorder(next: DailyLine[]): void {
    setOrder(next)
    startSaving(async () => {
      await saveDay(
        view.day,
        next.map((line) => ({ id: line.id, raw: line.raw }))
      )
      router.refresh()
      setOrder(null)
    })
  }

  const grab = useRowDrag(listRef, lines, reorder)

  return (
    <Card
      className={`w-full max-w-xl px-6 pt-5 pb-6 ${saving ? 'opacity-90' : ''}`}
      onClick={() => (editing ? commit(entries) : setEntries(toEntries(view.lines)))}
    >
      <header className="flex items-baseline justify-between gap-4 pb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[15px] tracking-[-0.01em]">{STANDING_LABEL[view.standing]}</h1>
          <Eyebrow>{longDate(view.day)}</Eyebrow>
        </div>
        <div className="flex items-center gap-1">
          <Eyebrow className="mr-2">
            {view.done}/{view.total}
          </Eyebrow>
          <Step to={view.previous} glyph="‹" label="Previous day" />
          <Step to={view.next} glyph="›" label="Next day" />
        </div>
      </header>

      {editing ? (
        <LineEditor
          lines={entries}
          suggestions={view.suggestions}
          onChange={setEntries}
          onDone={() => commit(entries)}
        />
      ) : (
        <TaskList lines={lines} listRef={listRef} onToggle={toggle} onGrab={grab} />
      )}

      <p className="pt-5 text-center text-[11px] text-ink-faint">
        {editing ? 'Enter for a new line · Esc to finish' : 'Click the card to edit'}
      </p>
    </Card>
  )
}

function TaskList({
  lines,
  listRef,
  onToggle,
  onGrab,
}: {
  lines: DailyLine[]
  listRef: React.RefObject<HTMLUListElement | null>
  onToggle: (line: DailyLine, done: boolean) => void
  onGrab: (index: number) => (event: React.PointerEvent) => void
}) {
  if (lines.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-ink-faint">
        Nothing written for this day. Click to start.
      </p>
    )
  }

  return (
    <ul ref={listRef} className="flex flex-col gap-0.5">
      {lines.map((line, index) => (
        <TaskRow
          key={line.id}
          line={line}
          onToggle={(done) => onToggle(line, done)}
          onGrab={onGrab(index)}
        />
      ))}
    </ul>
  )
}

/** Left and right move between yesterday, today and tomorrow. */
function useDayShortcuts(view: DailyView, editing: boolean): void {
  const router = useRouter()

  useEffect(() => {
    if (editing) return

    function onKey(event: KeyboardEvent): void {
      if (event.key === 'ArrowLeft' && view.previous) router.push(`/daily?day=${view.previous}`)
      if (event.key === 'ArrowRight' && view.next) router.push(`/daily?day=${view.next}`)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, router, view.previous, view.next])
}

/**
 * Pointer-based reordering, so it works with a finger as well as a mouse.
 * Row midpoints are measured once at grab time and compared against the
 * pointer, which is enough for a short vertical list.
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
      target = rows.findIndex((row) => move.clientY < row.bottom)
      if (target === -1) target = rows.length - 1
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
