import type { Body, Link } from './body'
import {
  applyAnchor,
  applyHoming,
  applyRepulsion,
  applySprings,
  resolveCollisions,
} from './forces'

/**
 * The loop that runs the forces.
 *
 * Timesteps are fixed rather than measured off the clock. A dropped
 * frame therefore slows the animation down instead of changing where the
 * graph ends up, which is what keeps the settled layout identical from
 * one visit to the next.
 */

/**
 * The tuned constants.
 *
 * Repulsion and spring are a pair and only their ratio matters: raise one
 * without the other and every edge settles long, which is how the graph
 * once came to rest 25% past its own rest lengths.
 *
 * These are hand-tuned values, arrived at with a temporary panel of
 * sliders over this object. Every number here was felt rather than
 * derived, so change them by feel too — and check a throw afterwards,
 * because the settled graph and a released one are different regimes and
 * a value can be right for one and wrong for the other.
 */
export const physicsConfig = {
  /**
   * Sets how much air a node insists on. Balanced against SPRING below.
   */
  REPULSION: 8,

  /**
   * Beyond this many pixels, nodes stop pushing on each other at all.
   */
  REPULSION_RANGE: 250,

  /**
   * Stiffness of an edge.
   */
  SPRING: 0.13,

  /**
   * Pull toward the layout's chosen position — see `applyHoming`. Tuned
   * against the real graph rather than a toy one: a nine-node fixture
   * comes home at almost any value, and only the full tree shows that a
   * subcategory dragged across the screen needs this much to actually
   * arrive before the graph goes cold.
   */
  HOMING: 0.125,

  /**
   * How hot the graph runs while a node is under the pointer — warm
   * enough that its neighbours get out of the way as you move it.
   */
  DRAG_ALPHA: 0.5,

  /**
   * And how hot it runs once you let go.
   *
   * This is the snappiness dial. It used to be 0.22, well below the drag
   * temperature, on the theory that a released node should ease home
   * rather than snap to it. In practice the graph went cold while the
   * branch was still crawling back, and a thrown subcategory simply
   * stopped wherever it had got to — which is the "too permissive"
   * complaint exactly. Releasing now costs as much energy as dragging,
   * so the arrangement is always reached.
   */
  RELEASE_ALPHA: 0.5,

  /**
   * Velocity kept between ticks. Lower means a more viscous graph.
   *
   * This was tuned all the way down to the bottom of the range that was
   * on offer, so the graph may well want to be thicker still.
   */
  FRICTION: 0.5,

  /**
   * How quickly the whole system cools. Lower means a longer, lazier settle.
   */
  COOLING: 0.012,

  /** Below this the graph is still and there is nothing left to paint. */
  COOL_ENOUGH: 0.005,

  /** Clear air left between two boxes that had to be pushed apart. */
  COLLISION_PADDING: 55,
}

/** A body held toward a point: the root at the centre, or an opened card. */
export type Anchor = { id: string; x: number; y: number; strength: number }

export type Frame = { halfWidth: number; halfHeight: number }

export type Simulation = {
  bodies: Map<string, Body>
  links: Link[]
  anchors: Anchor[]
  frame: Frame
  alpha: number
}

export function createSimulation(frame: Frame): Simulation {
  return { bodies: new Map(), links: [], anchors: [], frame, alpha: 1 }
}

/**
 * Wake the graph back up.
 *
 * Called whenever the shape changes — a branch collapsed, a habit added,
 * a card opened. The surviving nodes keep their positions and the forces
 * simply redistribute them from there, so the graph rearranges rather
 * than being laid out afresh.
 */
export function reheat(simulation: Simulation, alpha = 1): void {
  simulation.alpha = Math.max(simulation.alpha, alpha)
}

/**
 * Set the temperature outright, downward as well as up.
 *
 * `reheat` only ever raises it, which is what a restructure wants.
 * Letting go of a dragged node is the opposite case: the graph is
 * already warm from the dragging, and it should finish cooler than that
 * rather than hotter, so that it eases home instead of snapping.
 */
export function setAlpha(simulation: Simulation, alpha: number): void {
  simulation.alpha = alpha
}

export function isCool(simulation: Simulation): boolean {
  return simulation.alpha < physicsConfig.COOL_ENOUGH
}

/** One tick. Forces into velocity, velocity into position, then cool a little. */
export function step(simulation: Simulation): void {
  const bodies = [...simulation.bodies.values()]
  const { alpha } = simulation

  applyRepulsion(bodies, physicsConfig.REPULSION, physicsConfig.REPULSION_RANGE, alpha)
  applySprings(simulation.bodies, simulation.links, physicsConfig.SPRING, alpha)
  applyHoming(bodies, physicsConfig.HOMING, alpha)

  for (const anchor of simulation.anchors) {
    applyAnchor(simulation.bodies.get(anchor.id), anchor.x, anchor.y, anchor.strength, alpha)
  }

  integrate(bodies)
  resolveCollisions(bodies, physicsConfig.COLLISION_PADDING)

  simulation.alpha -= simulation.alpha * physicsConfig.COOLING
}

function integrate(bodies: Body[]): void {
  for (const body of bodies) {
    if (body.pinned) {
      body.vx = 0
      body.vy = 0
      continue
    }

    body.vx *= physicsConfig.FRICTION
    body.vy *= physicsConfig.FRICTION
    body.x += body.vx
    body.y += body.vy
  }
}

/**
 * Run the simulation forward without painting.
 *
 * Used once before the first frame so the graph arrives already in
 * shape, and used to completion for anyone who has asked their system
 * for less movement — they get the settled layout with no journey to it.
 */
export function settle(simulation: Simulation, ticks: number): void {
  for (let tick = 0; tick < ticks && !isCool(simulation); tick++) step(simulation)
}
