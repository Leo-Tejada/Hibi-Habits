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

      const centres = Math.hypot(dx, dy)

      if (centres > range) continue

      // The cutoff is a question about centres; the floor is a question
      // about denominators. Doing both to one number meant a body wider
      // than `range` — a card — floored its way past the cutoff and
      // stopped repelling entirely, which is the exact opposite of what
      // a node that just grew to fill the screen should do.
      const distance = Math.max(centres, contactDistance(a, b), EPSILON)
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

/**
 * Draw every body back toward the place the layout picked for it.
 *
 * Repulsion and springs together have many stable arrangements, and they
 * will settle into whichever one they were last pushed toward. That is
 * why throwing a subcategory across the screen used to leave it there:
 * it came home, the neighbours had shuffled, and the whole branch cooled
 * into a *different* valid arrangement a couple of hundred pixels off.
 *
 * This is the force that says which arrangement is the right one. It is
 * deliberately the weakest of the four — strong enough to decide between
 * two equilibria, far too weak to flatten the graph onto its seed — so
 * collapsing a branch still redistributes the rest, and dragging still
 * feels like pushing on something springy rather than fighting a magnet.
 */
export function applyHoming(bodies: Body[], strength: number, alpha: number): void {
  for (const body of bodies) {
    if (body.pinned) continue

    body.vx += (body.homeX - body.x) * strength * alpha
    body.vy += (body.homeY - body.y) * strength * alpha
  }
}
