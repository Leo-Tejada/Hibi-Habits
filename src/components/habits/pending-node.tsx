'use client'

import { useState, type KeyboardEvent } from 'react'
import { paintFor } from '@/lib/habits/node-paint'
import type { GraphNode } from '@/lib/habits/tree'

/**
 * A habit being named.
 *
 * It joins the graph as a real node the moment you ask for it, so the
 * physics makes room for it before it exists — you can see where the new
 * one is going to live while you are still typing its name. A name is
 * all it asks for: the schedule comes later, and until it has one the
 * habit writes nothing into your days.
 */
export function PendingNode({
  node,
  width,
  height,
  saving,
  onSubmit,
  onCancel,
}: {
  node: GraphNode
  width: number
  height: number
  saving: boolean
  onSubmit: (title: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const paint = paintFor(node.kind, node.category)

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') onSubmit(title)
    if (event.key === 'Escape') onCancel()
  }

  return (
    <input
      autoFocus
      value={title}
      disabled={saving}
      placeholder="Name it"
      aria-label={`New habit in ${node.label}`}
      onChange={(event) => setTitle(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => {
        if (!saving) onCancel()
      }}
      style={{
        width,
        height,
        backgroundColor: paint.background,
        color: paint.color,
        // Dashed until it is real, like a collapsed branch.
        borderColor: paint.color,
      }}
      className="border border-dashed px-3 text-center text-[12px] outline-none placeholder:text-ink-faint disabled:opacity-60"
    />
  )
}
