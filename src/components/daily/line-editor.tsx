'use client'

import { useEffect, useRef, useState } from 'react'
import type { LineEntry } from '@/types/daily'

export type EditorLine = LineEntry & { locked: boolean }

const MAX_SUGGESTIONS = 5

/** Complete on the first token, ignoring any time already typed. */
function head(value: string): string {
  return value.trim().split(/\s+/)[0] ?? ''
}

function matchesFor(value: string, suggestions: string[]): string[] {
  const typed = head(value).toLowerCase()

  if (typed.length < 2) return []
  return suggestions
    .filter((option) => option.toLowerCase().startsWith(typed) && option.toLowerCase() !== typed)
    .slice(0, MAX_SUGGESTIONS)
}

function withHead(value: string, replacement: string): string {
  const rest = value.trim().split(/\s+/).slice(1)

  return [replacement, ...rest].join(' ')
}

/**
 * Edit mode. It reads as a block of text, but every line is bound to its
 * task — which is what lets a generated line genuinely refuse edits, and
 * what stops fixing a typo from losing the fact that a task was done.
 */
export function LineEditor({
  lines,
  suggestions,
  onChange,
  onDone,
}: {
  lines: EditorLine[]
  suggestions: string[]
  onChange: (next: EditorLine[]) => void
  onDone: () => void
}) {
  const [focused, setFocused] = useState<number | null>(null)
  const fields = useRef<(HTMLInputElement | null)[]>([])

  function focus(index: number): void {
    requestAnimationFrame(() => fields.current[index]?.focus())
  }

  // Opening the editor should land the caret where you are going to type,
  // which is the blank line at the bottom. Writing the day is the whole
  // reason for coming here.
  useEffect(() => {
    fields.current.at(-1)?.focus()
  }, [])

  function replace(index: number, raw: string): void {
    onChange(lines.map((line, at) => (at === index ? { ...line, raw } : line)))
  }

  function insertAfter(index: number): void {
    const next = [...lines]

    next.splice(index + 1, 0, { id: null, raw: '', locked: false })
    onChange(next)
    focus(index + 1)
  }

  function removeAt(index: number): void {
    onChange(lines.filter((_, at) => at !== index))
    focus(Math.max(0, index - 1))
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>, index: number): void {
    const value = lines[index].raw
    const options = matchesFor(value, suggestions)

    if (event.key === 'Tab' && options.length > 0) {
      event.preventDefault()
      replace(index, withHead(value, options[0]))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      insertAfter(index)
      return
    }
    if (event.key === 'Backspace' && value === '' && lines.length > 1) {
      event.preventDefault()
      removeAt(index)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onDone()
      return
    }
    if (event.key === 'ArrowUp' && index > 0) focus(index - 1)
    if (event.key === 'ArrowDown' && index < lines.length - 1) focus(index + 1)
  }

  return (
    <ul className="flex flex-col gap-0.5" onClick={(event) => event.stopPropagation()}>
      {lines.map((line, index) => (
        <li key={line.id ?? `new-${index}`} className="relative">
          <input
            ref={(element) => {
              fields.current[index] = element
            }}
            value={line.raw}
            readOnly={line.locked}
            aria-label={line.locked ? `${line.raw} (from a habit, locked)` : 'Task line'}
            title={line.locked ? 'Written by a habit’s schedule — edit the habit to change it' : undefined}
            onChange={(event) => replace(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            onFocus={() => setFocused(index)}
            onBlur={() => setFocused((at) => (at === index ? null : at))}
            className={`w-full rounded-md bg-transparent px-2 py-1.5 font-mono text-[13px] outline-none ${
              line.locked
                ? 'cursor-not-allowed text-ink-faint'
                : 'text-ink caret-ink focus:bg-well'
            }`}
          />

          {focused === index && !line.locked && (
            <Suggestions
              options={matchesFor(line.raw, suggestions)}
              onPick={(option) => replace(index, withHead(line.raw, option))}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

function Suggestions({
  options,
  onPick,
}: {
  options: string[]
  onPick: (option: string) => void
}) {
  if (options.length === 0) return null

  return (
    <ul className="absolute left-2 top-full z-10 mt-0.5 min-w-56 overflow-hidden rounded-md border border-line bg-panel shadow-lg">
      {options.map((option, index) => (
        <li key={option}>
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              onPick(option)
            }}
            className="block w-full px-2.5 py-1.5 text-left font-mono text-[12px] text-ink-dim hover:bg-well hover:text-ink"
          >
            {option}
            {index === 0 && <span className="ml-2 text-[10px] text-ink-faint">tab</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}
