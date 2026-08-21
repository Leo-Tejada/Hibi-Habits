import type { Body, Link } from './body'
import {
  applyAnchor,
  applyRepulsion,
  applySprings,
  containBodies,
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

export const physicsConfig = {
  /**
   * Sets how much air a node insists on. Balanced against SPRING below.
   */
  REPULSION: 15,

  /**
   * Beyond this many pixels, nodes stop pushing on each other at all.
   */
  REPULSION_RANGE: 250,

  /**
   * Stiffness of an edge.
   */
  SPRING: 0.1,

  /**
   * Velocity kept between ticks. Lower means a more viscous graph.
   */
  FRICTION: 0.9,

  /**
   * How quickly the whole system cools. Lower means a longer, lazier settle.
   */
  COOLING: 0.010,

  /** Below this the graph is still and there is nothing left to paint. */
  COOL_ENOUGH: 0.005,

  /** Clear air left between two boxes that had to be pushed apart. */
  COLLISION_PADDING: 50,
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

  for (const anchor of simulation.anchors) {
    applyAnchor(simulation.bodies.get(anchor.id), anchor.x, anchor.y, anchor.strength, alpha)
  }

  integrate(bodies)
  resolveCollisions(bodies, physicsConfig.COLLISION_PADDING)
  containBodies(bodies, simulation.frame.halfWidth, simulation.frame.halfHeight)

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
