import { QuestKind } from '@/generated/prisma/enums'
import { categoryColor, type Category } from '@/lib/taxonomy'
import type { GraphNode } from './tree'

/**
 * What colour a node is.
 *
 * Every node on the graph is a sharp-cornered block filled with the hue
 * of the category it belongs to. Nothing is distinguished by shape any
 * more: the structural nodes are set in the mono face and the habits in
 * the text face, and that is the whole of the difference.
 *
 * Depth is carried by strength instead. A category is its hue at full
 * force; an area is weaker; a habit weaker still. "Weaker" means mixed
 * toward the panel, which reads correctly in both themes — paler against
 * a light page, dimmer against a dark one, receding either way.
 *
 * The one exception is You, which belongs to all three categories and so
 * has no hue of its own. It is the only unfilled node on the screen.
 */

/**
 * What a node is, for colouring purposes only.
 *
 * Finer than `GraphNodeKind` in exactly one place: a main quest and a
 * side quest are one kind everywhere else — same box, same ring, same
 * links — and differ only in how strongly they are filled. Splitting the
 * tier rather than the kind keeps that distinction from leaking into the
 * tree, the sizes and the physics, none of which care.
 */
export type PaintTier = 'root' | 'category' | 'area' | 'questMain' | 'questSide' | 'habit' | 'pending'

/**
 * Percent of the category hue left in the mix, by tier.
 *
 * A descending ladder from the category down to the habit, with the two
 * quest tiers taking their own steps between the area and the habit —
 * near enough to their neighbours to read as the same family, far enough
 * apart that a main quest is visibly more present than a side one. The
 * category, area and habit numbers are settled design and are not mine
 * to move.
 */
const STRENGTH: Record<PaintTier, number> = {
  root: 0,
  category: 100,
  area: 45,
  questMain: 39,
  questSide: 31,
  habit: 24,
  pending: 24,
}

/** Which tier a node paints as. */
export function tierOf(node: Pick<GraphNode, 'kind' | 'quest'>): PaintTier {
  if (node.kind !== 'quest') return node.kind
  return node.quest?.kind === QuestKind.SIDE ? 'questSide' : 'questMain'
}

/**
 * Below this, a fill is pale enough (or dim enough) that ordinary --ink
 * reads on it. At full strength the label has to invert instead.
 */
const INVERTS_TEXT_ABOVE = 60

export type NodePaint = {
  background: string
  color: string
  /**
   * Matches the fill, so it is invisible until something wants to show
   * it — a collapsed branch turns it dashed. Keeping the border present
   * either way means the box never changes size, which matters because
   * the simulation was told what that size is.
   */
  borderColor: string
}

export function paintFor(tier: PaintTier, category: Category | null): NodePaint {
  if (tier === 'root' || !category) {
    return { background: 'var(--ground)', color: 'var(--ink)', borderColor: 'var(--line)' }
  }

  const strength = STRENGTH[tier]
  const background = `color-mix(in srgb, ${categoryColor(category)} ${strength}%, var(--panel))`

  return {
    background,
    color: strength > INVERTS_TEXT_ABOVE ? 'var(--on-hue)' : 'var(--ink)',
    borderColor: background,
  }
}

/** Archived habits keep their place but give up their colour. */
export const FADED: NodePaint = {
  background: 'var(--well)',
  color: 'var(--ink-faint)',
  borderColor: 'var(--line)',
}
