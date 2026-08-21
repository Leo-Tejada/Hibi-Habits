'use client'

import type { GraphNode } from '@/lib/habits/tree'
import { paintFor } from '@/lib/habits/node-paint'
import type { QuestNodeView } from '@/types/habits'

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
  // Use category colors, but maybe slightly different style for quests.
  const paint = paintFor(node.kind, node.category)

  return (
    <div
      className={`relative overflow-hidden border border-dashed transition-[width,height,background-color] duration-300 ease-out`}
      style={{
        width,
        height,
        backgroundColor: paint.background,
        borderColor: paint.color, // bold border for quests
        color: paint.color,
      }}
    >
      <div className="flex size-full items-center justify-center px-3 text-[12px] font-semibold">
        <span className="truncate">{quest.title}</span>
      </div>
    </div>
  )
}
