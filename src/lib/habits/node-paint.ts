import { categoryColor, type Category } from '@/lib/taxonomy'
import type { GraphNodeKind } from './tree'

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

/** Percent of the category hue left in the mix, by ring. */
const STRENGTH: Record<GraphNodeKind, number> = {
  root: 0,
  category: 100,
  area: 45,
  quest: 35,
  habit: 24,
  pending: 24,
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

export function paintFor(kind: GraphNodeKind, category: Category | null): NodePaint {
  if (kind === 'root' || !category) {
    return { background: 'var(--ground)', color: 'var(--ink)', borderColor: 'var(--line)' }
  }

  const strength = STRENGTH[kind]
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
