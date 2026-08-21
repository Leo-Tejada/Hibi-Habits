/**
 * Where a body starts before the physics takes over.
 *
 * Nothing is scattered at random, and nothing is scattered by hashing an
 * id either. The first three rings of this graph are the same thirteen
 * nodes forever, so their angles are known in advance and simply
 * assigned — the three categories a third of a turn apart, each area
 * fanned around its category, each habit fanned around its area.
 *
 * Two things follow. The graph settles into the same arrangement on
 * every visit, so you can build a memory of where your own habits live.
 * And the simulation starts from an untangled tree, which matters more
 * than it sounds: a force layout has many stable arrangements, plenty of
 * them crossed, and it will happily settle into whichever one it was
 * dropped nearest. Starting it in the right shape is what keeps it there.
 */

export type SeedPoint = { x: number; y: number }

export function polarPoint(radius: number, angle: number): SeedPoint {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

/**
 * Fan `count` siblings around a shared heading, `spread` radians apart
 * and centred on it. One child sits straight out from its parent.
 */
export function fanAngle(base: number, index: number, count: number, spread: number): number {
  return base + (index - (count - 1) / 2) * spread
}
