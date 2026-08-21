import type { Box } from '@/lib/graph/body'
import type { GraphNodeKind } from './tree'

/**
 * How big a node's box is, worked out from its label rather than measured.
 *
 * Measuring the real DOM would be more accurate and would also make the
 * layout depend on when the web font finished loading — the same graph
 * would settle differently on a cold cache than on a warm one. An
 * estimate is deterministic, which matters more here than a few pixels.
 */

/**
 * Rough advance width per character, in units of the font size. Both are
 * set a little wide on purpose: the box is the element's real width, so
 * a low estimate does not merely misinform the physics, it clips the
 * label. Slack costs a few pixels of air inside a pill.
 */
const MONO_ADVANCE = 0.66
const SANS_ADVANCE = 0.62

/**
 * Quests are the one place the text face is not set at its regular
 * weight: a main quest is bold, which runs a few percent wider for the
 * same string. One estimate has to cover both kinds, because the box is
 * decided before anything knows which kind it is, so it is the bold one.
 */
const SANS_BOLD_ADVANCE = 0.66

type Metrics = {
  fontSize: number
  /** Extra letter-spacing, in units of the font size. Structural labels are tracked out. */
  tracking: number
  advance: number
  paddingX: number
  height: number
  /** Labels longer than this are clipped in the interface, so stop counting. */
  maxChars: number
  /**
   * Width floor, in characters. Only the input needs one: its label is a
   * placeholder that the name you type will outgrow, and the box is a
   * fixed pixel width, so sizing it to "New habit" would scroll the text
   * out of sight as you wrote.
   */
  minChars: number
}

const METRICS: Record<GraphNodeKind, Metrics> = {
  root: { fontSize: 13, tracking: 0.14, advance: MONO_ADVANCE, paddingX: 20, height: 34, maxChars: 8, minChars: 0 },
  category: { fontSize: 11, tracking: 0.12, advance: MONO_ADVANCE, paddingX: 16, height: 28, maxChars: 16, minChars: 0 },
  area: { fontSize: 11, tracking: 0.12, advance: MONO_ADVANCE, paddingX: 14, height: 26, maxChars: 12, minChars: 0 },
  quest: { fontSize: 12, tracking: 0, advance: SANS_BOLD_ADVANCE, paddingX: 15, height: 28, maxChars: 24, minChars: 0 },
  habit: { fontSize: 12, tracking: 0, advance: SANS_ADVANCE, paddingX: 13, height: 26, maxChars: 20, minChars: 0 },
  pending: { fontSize: 12, tracking: 0, advance: SANS_ADVANCE, paddingX: 13, height: 26, maxChars: 22, minChars: 20 },
}

/**
 * Area nodes carry a `+` at each end — habit on the right, side quest on
 * the left — and habit nodes one of their own for the side quests they
 * will serve. All of them have to fit inside the same box without
 * crowding the label. Counted twice: the second area button arrived with
 * side quests and the allowance did not, so every area node was 18px
 * narrower than the physics had been told.
 */
const ADD_BUTTON_WIDTH = 18
const ADD_BUTTONS_PER_AREA = 2

export function boxFor(kind: GraphNodeKind, label: string): Box {
  const metrics = METRICS[kind]
  const chars = Math.max(Math.min(label.length, metrics.maxChars), metrics.minChars)
  const glyphs = chars * metrics.fontSize * (metrics.advance + metrics.tracking)
  const extra = kind === 'area' ? ADD_BUTTON_WIDTH * ADD_BUTTONS_PER_AREA : kind === 'habit' ? ADD_BUTTON_WIDTH : 0

  return {
    halfWidth: (glyphs + metrics.paddingX * 2 + extra) / 2,
    halfHeight: metrics.height / 2,
  }
}

/**
 * The box an opened habit takes while it is a card.
 *
 * Kept inside the frame so a habit that happened to settle near an edge
 * still opens whole. The card is anchored toward the centre as it grows,
 * so this is a ceiling rather than a position.
 */
export function cardBox(frameHalfWidth: number, frameHalfHeight: number): Box {
  return {
    halfWidth: Math.min(210, Math.max(120, frameHalfWidth - 24)),
    halfHeight: Math.min(150, Math.max(100, frameHalfHeight - 24)),
  }
}
