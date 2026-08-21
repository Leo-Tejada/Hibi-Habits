/**
 * A thing the simulation moves around.
 *
 * Nodes are boxes, not circles: a habit pill is wide and short, a
 * structural node is nearly square, and an opened card is enormous.
 * Treating them all as circles would clear a useless amount of room
 * above and below every pill, so half-extents are carried instead of a
 * single radius and collision resolves per axis.
 */
export type Body = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  halfWidth: number
  halfHeight: number
  /**
   * Where the layout wants this body to be — the seeded ring position,
   * recomputed whenever the shape of the graph changes. `applyHoming`
   * pulls it back here, which is what makes a drag temporary.
   */
  homeX: number
  homeY: number
  /** Held where it is — under the pointer, or anchored by the layout. */
  pinned: boolean
}

/** A spring between two bodies, happiest at `distance` apart. */
export type Link = {
  source: string
  target: string
  distance: number
}

export type Box = { halfWidth: number; halfHeight: number }

export function makeBody(id: string, x: number, y: number, box: Box): Body {
  return { id, x, y, vx: 0, vy: 0, homeX: x, homeY: y, ...box, pinned: false }
}

/**
 * How hard a body pushes its neighbours. Scaling with the diagonal means
 * a node that grew into a card clears proportionally more space, which
 * is exactly the behaviour wanted when one opens.
 */
export function chargeOf(body: Body): number {
  return Math.hypot(body.halfWidth, body.halfHeight)
}

/** The closest two bodies could be without their boxes touching. */
export function contactDistance(a: Body, b: Body): number {
  return Math.hypot(a.halfWidth + b.halfWidth, a.halfHeight + b.halfHeight)
}
