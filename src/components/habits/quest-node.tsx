'use client'

import { QuestKind } from '@/generated/prisma/enums'
import type { GraphNode } from '@/lib/habits/tree'
import { paintFor, tierOf } from '@/lib/habits/node-paint'
import type { QuestNodeView } from '@/types/habits'

/**
 * A quest: what a season is actually for.
 *
 * Two things separate the two kinds, and neither of them is shape or
 * hue-family, both of which are already spoken for. A main quest — one
 * of the three anchors of the season — is set in bold. A side quest,
 * optional and unlimited, is set in italic. On top of that each takes
 * its own step on the fill ladder, so a main quest sits nearer the area
 * above it and a side quest nearer the habits below.
 *
 * The border matches the fill, like every other node here. It used to be
 * dashed and drawn in the text colour, which read as "provisional" —
 * the language a pending node uses while you are still naming it, and
 * quite wrong for the most settled thing on the graph.
 */
export function QuestNode({
  node,
  quest,
  width,
  height,
}: {
  node: GraphNode
  quest: QuestNodeView
  width: number
  height: number
}) {
  const paint = paintFor(tierOf(node), node.category)
  const main = quest.kind === QuestKind.MAIN

  return (
    <div
      className="relative overflow-hidden border transition-[width,height,background-color] duration-300 ease-out"
      style={{
        width,
        height,
        backgroundColor: paint.background,
        borderColor: paint.borderColor,
        color: paint.color,
      }}
    >
      <div
        className={`flex size-full items-center justify-center px-3 text-[12px] ${
          main ? 'font-bold' : 'italic'
        }`}
        title={`${quest.title} — ${main ? 'main' : 'side'} quest`}
      >
        <span className="truncate">{quest.title}</span>
      </div>
    </div>
  )
}
