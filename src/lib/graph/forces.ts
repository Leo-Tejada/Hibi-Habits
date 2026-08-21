import { chargeOf, contactDistance, type Body, type Link } from './body'

/**
 * The four forces, one function each.
 *
 * Every one of them writes into velocity rather than position, and every
 * one is scaled by `alpha` so the whole system cools to a standstill
 * instead of jittering forever. `resolveCollisions` is the exception and
 * says why in its own comment.
 */

/** Guards the inverse square from dividing by nothing. */
const EPSILON = 1e-6

/**
 * Every node pushes every other node, falling off with the square of the
 * distance — the molecular repulsion that keeps the graph spread out.
 *
 * Two guards, both learned the hard way. Distance is floored at the
 * point the two boxes would touch, or a pair that overlaps sees a
 * near-zero denominator and is fired across the screen. And repulsion
 * stops entirely past `range`: without a cutoff, every distant node in
 * the graph contributes a little outward push, they sum to far more than
 * the springs can answer, and the tree stretches until it tangles.
 */
export function applyRepulsion(
  bodies: Body[],
  strength: number,
  range: number,
  alpha: number
): void {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]
      const dx = b.x - a.x
      const dy = b.y - a.y

      if (Math.abs(dx) > range || Math.abs(dy) > range) continue

      const distance = Math.max(Math.hypot(dx, dy), contactDistance(a, b), EPSILON)

      if (distance > range) continue
      const push = (strength * chargeOf(a) * chargeOf(b) * alpha) / (distance * distance)
      const ux = dx / distance
      const uy = dy / distance

      a.vx -= ux * push
      a.vy -= uy * push
      b.vx += ux * push
      b.vy += uy * push
    }
  }
}

/**
 * Edges are springs. They pull a child back when repulsion has thrown it
 * too far and push it out when it has drifted in too close, so each ring
 * of the hierarchy holds its own radius.
 */
export function applySprings(
  bodies: Map<string, Body>,
  links: Link[],
  strength: number,
  alpha: number
): void {
  for (const link of links) {
    const a = bodies.get(link.source)
    const b = bodies.get(link.target)

    if (!a || !b) continue

    const dx = b.x - a.x
    const dy = b.y - a.y
    const distance = Math.max(Math.hypot(dx, dy), EPSILON)
    const pull = (distance - link.distance) * strength * alpha
    const ux = dx / distance
    const uy = dy / distance

    a.vx += ux * pull
    a.vy += uy * pull
    b.vx -= ux * pull
    b.vy -= uy * pull
  }
}

/**
 * Pull one body toward a point.
 *
 * Nothing is nailed down in this graph. The root is merely anchored hard
 * at the centre, which means an opened card — anchored harder still —
 * can shoulder even the root aside as it comes forward.
 */
export function applyAnchor(
  body: Body | undefined,
  x: number,
  y: number,
  strength: number,
  alpha: number
): void {
  if (!body) return

  body.vx += (x - body.x) * strength * alpha
  body.vy += (y - body.y) * strength * alpha
}

/**
 * Separate boxes that ended up on top of each other.
 *
 * This one moves positions directly instead of adding a velocity, and
 * ignores alpha. Overlap is not a force to be balanced against the
 * others — it is a state that must simply not persist, including in a
 * cooled-off graph where the forces have nothing left to give.
 */
export function resolveCollisions(bodies: Body[], padding: number): void {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      separate(bodies[i], bodies[j], padding)
    }
  }
}

/** Push a pair apart along whichever axis they overlap by the least. */
function separate(a: Body, b: Body, padding: number): void {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const overlapX = a.halfWidth + b.halfWidth + padding - Math.abs(dx)
  const overlapY = a.halfHeight + b.halfHeight + padding - Math.abs(dy)

  if (overlapX <= 0 || overlapY <= 0) return

  if (overlapX < overlapY) shift(a, b, (Math.sign(dx) || 1) * overlapX * 0.5, 0)
  else shift(a, b, 0, (Math.sign(dy) || 1) * overlapY * 0.5)
}

/** Both give way, unless one of them is pinned — then the other yields it all. */
function shift(a: Body, b: Body, dx: number, dy: number): void {
  if (a.pinned && b.pinned) return

  if (a.pinned) {
    b.x += dx * 2
    b.y += dy * 2
    return
  }
  if (b.pinned) {
    a.x -= dx * 2
    a.y -= dy * 2
    return
  }
  a.x -= dx
  a.y -= dy
  b.x += dx
  b.y += dy
}

/** Keep everything inside the frame, so nothing wanders off to be lost. */
export function containBodies(bodies: Body[], halfWidth: number, halfHeight: number): void {
  for (const body of bodies) {
    const limitX = Math.max(0, halfWidth - body.halfWidth)
    const limitY = Math.max(0, halfHeight - body.halfHeight)

    body.x = Math.min(limitX, Math.max(-limitX, body.x))
    body.y = Math.min(limitY, Math.max(-limitY, body.y))
  }
}
