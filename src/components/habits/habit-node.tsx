'use client'

import type { GraphNode } from '@/lib/habits/tree'
import { FADED, paintFor, tierOf } from '@/lib/habits/node-paint'
import type { HabitNodeView } from '@/types/habits'
import { HabitCard } from './habit-card'

/**
 * A habit: a sharp block filled with the hue of the area it belongs to,
 * set in the text face rather than the mono one. That typeface is the
 * only thing separating it from the structural nodes around it.
 *
 * The same element is both the block and the opened card. Nothing is
 * swapped out — its width, height and colour are simply given new values
 * and allowed to travel there, which is what makes the node look like it
 * grew into the card rather than being replaced by one. The two sets of
 * contents cross-fade across that journey.
 */
export function HabitNode({
  node,
  habit,
  width,
  height,
  open,
  seasonLabel,
  onOpen,
  onClose,
  onAddQuest,
}: {
  node: GraphNode
  habit: HabitNodeView
  width: number
  height: number
  open: boolean
  seasonLabel: string
  onOpen: () => void
  onClose: () => void
  onAddQuest: (() => void) | null
}) {
  const paint = habit.archived ? FADED : paintFor(tierOf(node), node.category)

  return (
    <div
      className={`group relative overflow-hidden border transition-[width,height,background-color,box-shadow] duration-300 ease-out ${
        open ? 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.28)]' : ''
      } ${habit.archived ? 'opacity-60' : ''}`}
      style={{
        width,
        height,
        // Opening turns it into the card that Journal and Quests will
        // also use, so it gives up its hue for the panel material.
        backgroundColor: open ? 'var(--panel)' : paint.background,
        borderColor: open ? 'var(--line)' : paint.borderColor,
        color: open ? 'var(--ink)' : paint.color,
      }}
    >
      <Layer shown={!open}>
        <button
          type="button"
          onClick={onOpen}
          disabled={habit.archived}
          title={habit.archived ? `${habit.title} — archived` : habit.title}
          className="flex size-full items-center justify-center px-3 text-[12px] disabled:cursor-default"
        >
          <span className="truncate">{habit.title}</span>
        </button>

        {onAddQuest ? (
          <button
            type="button"
            onClick={onAddQuest}
            title={`New side quest served by ${habit.title}`}
            style={{ color: paint.color }}
            // Hover reveals it on a mouse, focus and touch always —
            // the same rules the areas' `+` buttons play by.
            className="absolute right-0.5 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center font-mono text-[13px] leading-none opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
          >
            +<span className="sr-only">New side quest served by {habit.title}</span>
          </button>
        ) : null}
      </Layer>

      <Layer shown={open} delayed>
        <HabitCard habit={habit} seasonLabel={seasonLabel} onClose={onClose} />
      </Layer>
    </div>
  )
}

/** One of the two faces of the node. Only the shown one takes the pointer. */
function Layer({
  shown,
  delayed = false,
  children,
}: {
  shown: boolean
  delayed?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      aria-hidden={!shown}
      className={`absolute inset-0 transition-opacity duration-200 ${
        shown ? `opacity-100 ${delayed ? 'delay-150' : ''}` : 'pointer-events-none opacity-0'
      }`}
    >
      {children}
    </div>
  )
}
