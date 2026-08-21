'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { Subcategory } from '@/generated/prisma/enums'
import type { Box } from '@/lib/graph/body'
import type { Anchor } from '@/lib/graph/simulation'
import { boxFor, cardBox } from '@/lib/habits/node-size'
import { ROOT_ID, buildGraph, isStructural, type GraphNode } from '@/lib/habits/tree'
import { usePrefersReducedMotion } from '@/lib/motion'
import { createHabit, createSideQuest } from '@/server/actions/habits'
import type { HabitsView } from '@/types/habits'
import { GraphEdges } from './graph-edges'
import { HabitNode } from './habit-node'
import { QuestNode } from './quest-node'
import { PendingNode } from './pending-node'
import { StructuralNode } from './structural-node'
import { useFrame, useGraphLayout } from './use-graph-layout'

/**
 * Holds the root near the middle without nailing it down. Gentle: this
 * is the force you feel resisting you when you drag You off centre, and
 * the one that walks it back afterwards.
 */
const ROOT_ANCHOR = 0.05

/** Stronger, so an opened card can shoulder even the root out of its way. */
const CARD_ANCHOR = 0.06

const NOTHING_COLLAPSED: ReadonlySet<string> = new Set()

/**
 * The habits screen: a force-directed graph of the whole hierarchy.
 *
 * This component owns only the graph's *shape* — which nodes exist and
 * what state each is in. Where they sit is the simulation's business,
 * and it writes that straight to the DOM without going through React.
 */
export function HabitGraph({ view }: { view: HabitsView }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frame = useFrame(containerRef)
  const still = usePrefersReducedMotion()

  const [collapsed, setCollapsed] = useState(NOTHING_COLLAPSED)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pendingArea, setPendingArea] = useState<Subcategory | null>(null)
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null)
  const [pendingKind, setPendingKind] = useState<'habit' | 'quest' | null>(null)
  const [saving, startSaving] = useTransition()

  const graph = useMemo(
    () =>
      buildGraph({
        habits: view.habits,
        quests: view.quests,
        collapsed,
        pendingArea,
        pendingHabitId,
        pendingKind,
      }),
    [view.habits, view.quests, collapsed, pendingArea, pendingHabitId, pendingKind]
  )

  const boxes = useMemo(() => sizeNodes(graph.nodes, openId, frame), [graph.nodes, openId, frame])

  const anchors = useMemo<Anchor[]>(() => {
    const held: Anchor[] = [{ id: ROOT_ID, x: 0, y: 0, strength: ROOT_ANCHOR }]

    if (openId) held.push({ id: openId, x: 0, y: 0, strength: CARD_ANCHOR })
    return held
  }, [openId])

  const { startDrag, wasDragged } = useGraphLayout({
    containerRef,
    nodes: graph.nodes,
    links: graph.links,
    boxes,
    anchors,
    frame,
    still,
  })

  // Folding a branch away closes whatever was open inside it, rather
  // than leaving a card belonging to a node that is no longer there.
  const toggle = useCallback((id: string) => {
    setOpenId(null)
    setPendingArea(null)
    setPendingHabitId(null)
    setPendingKind(null)
    setCollapsed((folded) => {
      const next = new Set(folded)

      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const cancel = useCallback(() => {
    setPendingArea(null)
    setPendingHabitId(null)
    setPendingKind(null)
  }, [])

  // Which `+` was pressed decides what gets written. The left one makes a
  // side quest and the right one a habit; before this they both made a
  // habit, because `pendingKind` was set and then never read. A quest
  // opened from a habit node carries that habit's id, so the quest is
  // created already attached to the practice that will earn it.
  const save = useCallback(
    (area: Subcategory, title: string) => {
      if (title.trim().length === 0) {
        cancel()
        return
      }
      const kind = pendingKind
      const habitId = pendingHabitId

      startSaving(async () => {
        if (kind === 'quest') await createSideQuest(area, title, habitId ?? undefined)
        else await createHabit(area, title)
        cancel()
      })
    },
    [cancel, pendingHabitId, pendingKind, startSaving]
  )

  const close = useCallback(() => setOpenId(null), [])

  // Clicking the background backs out; *panning* the background does not.
  // The two start identically, so the decision has to wait for the
  // pointer to come up — closing on pointerdown meant the card vanished
  // the instant you went to move the canvas.
  const handleBackgroundPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if ((event.target as Element).closest('[data-body]')) return
      if (wasDragged()) return
      close()
      cancel()
    },
    [cancel, close, wasDragged]
  )

  useEscape(close)

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onPointerUp={handleBackgroundPointerUp}
    >
      <div data-layer="graph" className="absolute inset-0 origin-center">
        <GraphEdges links={graph.links} />

      {frame
        ? graph.nodes.map((node) => {
            const box = boxes.get(node.id)

            if (!box) return null

            const draggable = node.id !== openId && node.kind !== 'pending'

            return (
              <div
                key={node.id}
                data-body={node.id}
                style={{ zIndex: layerOf(node, openId) }}
                onPointerDown={draggable ? (event) => startDrag(node.id, event) : undefined}
                className="absolute left-1/2 top-1/2 touch-none"
              >
                {renderNode({
                  node,
                  box,
                  view,
                  openId,
                  collapsed,
                  saving,
                  wasDragged,
                  setOpenId,
                  setPendingArea,
                  setPendingHabitId,
                  setPendingKind,
                  cancel,
                  toggle,
                  save,
                })}
              </div>
            )
          })
        : null}
      </div>
    </div>
  )
}

/**
 * Every node's box, which is also its rendered size in pixels.
 *
 * The estimate is not a guess the layout has to live with — it is handed
 * straight back to the element as an explicit width and height, so what
 * the physics believes and what the browser draws are the same thing by
 * construction. An open node takes the card's box instead.
 */
function sizeNodes(
  nodes: GraphNode[],
  openId: string | null,
  frame: { halfWidth: number; halfHeight: number } | null
): Map<string, Box> {
  const boxes = new Map<string, Box>()

  for (const node of nodes) {
    const open = node.id === openId && frame !== null

    boxes.set(node.id, open ? cardBox(frame.halfWidth, frame.halfHeight) : boxFor(node.kind, node.label))
  }
  return boxes
}

/** An open card sits above the structure; the structure above the habits. */
function layerOf(node: GraphNode, openId: string | null): number {
  if (node.id === openId) return 30
  return isStructural(node.kind) ? 20 : 10
}

type RenderOptions = {
  node: GraphNode
  box: Box
  view: HabitsView
  openId: string | null
  collapsed: ReadonlySet<string>
  saving: boolean
  wasDragged: () => boolean
  setOpenId: (id: string | null) => void
  setPendingArea: (area: Subcategory | null) => void
  setPendingHabitId: (habitId: string | null) => void
  setPendingKind: (kind: 'habit' | 'quest' | null) => void
  cancel: () => void
  toggle: (id: string) => void
  save: (area: Subcategory, title: string) => void
}

function renderNode(options: RenderOptions) {
  const { node, box } = options
  const width = box.halfWidth * 2
  const height = box.halfHeight * 2

  if (node.kind === 'pending' && node.area) {
    return (
      <PendingNode
        node={node}
        width={width}
        height={height}
        saving={options.saving}
        onSubmit={(title) => options.save(node.area as Subcategory, title)}
        onCancel={options.cancel}
      />
    )
  }

  
  if (node.kind === 'quest' && node.quest) {
    return (
      <QuestNode
        node={node}
        quest={node.quest}
        width={width}
        height={height}
      />
    )
  }

  if (node.kind === 'habit' && node.habit) {
    return (
      <HabitNode
        node={node}
        habit={node.habit}
        width={width}
        height={height}
        open={node.id === options.openId}
        seasonLabel={options.view.seasonLabel}
        onOpen={() => {
          if (options.wasDragged()) return
          options.cancel()
          options.setOpenId(node.id)
        }}
        onClose={() => options.setOpenId(null)}
        onAddQuest={
          !node.habit.archived
            ? () => {
                options.setOpenId(null)
                options.setPendingArea(null)
                options.setPendingHabitId(node.habit!.id)
                options.setPendingKind('quest')
              }
            : null
        }
      />
    )
  }

  return (
    <StructuralNode
      node={node}
      width={width}
      height={height}
      collapsed={options.collapsed.has(node.id)}
      onToggle={
        node.kind === 'root'
          ? null
          : () => {
              if (!options.wasDragged()) options.toggle(node.id)
            }
      }
      onAdd={
        node.kind === 'area' && node.area
          ? () => {
              options.setOpenId(null)
              options.setPendingArea(node.area as Subcategory)
              options.setPendingHabitId(null)
              options.setPendingKind('habit')
            }
          : null
      }
      onAddQuest={
        node.kind === 'area' && node.area
          ? () => {
              options.setOpenId(null)
              options.setPendingArea(node.area as Subcategory)
              options.setPendingHabitId(null)
              options.setPendingKind('quest')
            }
          : null
      }
    />
  )
}

/** Escape backs out of whatever is open. */
function useEscape(onEscape: () => void): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onEscape()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onEscape])
}
