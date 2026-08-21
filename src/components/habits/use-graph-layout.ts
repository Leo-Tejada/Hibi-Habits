'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from 'react'
import { makeBody, type Body, type Box, type Link } from '@/lib/graph/body'
import { polarPoint } from '@/lib/graph/seed'
import {
  createSimulation,
  isCool,
  reheat,
  setAlpha,
  settle,
  step,
  type Anchor,
  type Frame,
  type Simulation,
} from '@/lib/graph/simulation'
import { ringRadiusFor, type GraphNode } from '@/lib/habits/tree'

/**
 * Ticks run before the first paint, so the graph arrives already in
 * shape rather than exploding outward from its seeded scatter.
 */
const WARM_UP_TICKS = 900

/** Enough to reach the fixed point when animation has been declined. */
const SETTLE_TICKS = 1200

/** Movement past this, in pixels, means the gesture was a drag and not a click. */
const DRAG_THRESHOLD = 4

/**
 * How hot the graph runs while a node is being dragged — warm enough
 * that its neighbours get out of the way as you move it.
 */
const DRAG_ALPHA = 0.5

/**
 * And how hot it runs once you let go. Much cooler, so the node drifts
 * back to its place over a second or so rather than snapping to it. Low
 * enough to be gentle, high enough that it still arrives before the
 * graph cools to a standstill.
 */
const RELEASE_ALPHA = 0.22

/**
 * Watch the container and report its half-extents.
 *
 * The initial size arrives through the observer's own first callback
 * rather than being read during the effect, which keeps state out of the
 * effect body — the rule the React compiler enforces here.
 */
export function useFrame(containerRef: RefObject<HTMLElement | null>): Frame | null {
  const [frame, setFrame] = useState<Frame | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      setFrame({
        halfWidth: entry.contentRect.width / 2,
        halfHeight: entry.contentRect.height / 2,
      })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef])

  return frame
}

/**
 * Bring the simulation's bodies in line with the nodes on screen.
 *
 * A node that was already there keeps its position and velocity, so
 * collapsing a branch rearranges the graph from where it stood rather
 * than laying it out again from scratch. Only genuinely new nodes are
 * seeded, and they are seeded from their id so the result is repeatable.
 */
function reconcile(simulation: Simulation, nodes: GraphNode[], boxes: Map<string, Box>): void {
  const next = new Map<string, Body>()

  for (const node of nodes) {
    const box = boxes.get(node.id)

    if (!box) continue

    const existing = simulation.bodies.get(node.id)

    if (existing) {
      existing.halfWidth = box.halfWidth
      existing.halfHeight = box.halfHeight
      next.set(node.id, existing)
      continue
    }

    const seed = polarPoint(ringRadiusFor(node.depth), node.seedAngle)

    next.set(node.id, makeBody(node.id, seed.x, seed.y, box))
  }
  simulation.bodies = next
}

/**
 * Write positions straight to the DOM.
 *
 * Nothing here goes through React. Re-rendering fifty nodes sixty times
 * a second would be pure waste when the only thing changing is a
 * transform, so the component renders the graph's *shape* and this
 * paints its *positions*.
 */
function paint(container: HTMLElement, simulation: Simulation, transform: {x: number, y: number, scale: number} = {x:0, y:0, scale:1}): void {
  const layer = container.querySelector('[data-layer="graph"]') as HTMLElement;
  if (layer) {
    layer.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  }
  const { halfWidth, halfHeight } = simulation.frame

  for (const element of container.querySelectorAll<HTMLElement>('[data-body]')) {
    const body = simulation.bodies.get(element.dataset.body ?? '')

    if (!body) continue
    element.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) translate(-50%, -50%)`
  }

  for (const line of container.querySelectorAll<SVGLineElement>('[data-link]')) {
    const source = simulation.bodies.get(line.dataset.source ?? '')
    const target = simulation.bodies.get(line.dataset.target ?? '')

    if (!source || !target) continue
    line.setAttribute('x1', String(halfWidth + source.x))
    line.setAttribute('y1', String(halfHeight + source.y))
    line.setAttribute('x2', String(halfWidth + target.x))
    line.setAttribute('y2', String(halfHeight + target.y))
  }
}

export type LayoutOptions = {
  containerRef: RefObject<HTMLElement | null>
  nodes: GraphNode[]
  links: Link[]
  boxes: Map<string, Box>
  anchors: Anchor[]
  frame: Frame | null
  still: boolean
}

export type Layout = {
  /** Begin dragging a node. Returns nothing; the drag lives on the window. */
  startDrag: (id: string, event: PointerEvent) => void
  /** True when the gesture that just ended moved far enough to be a drag. */
  wasDragged: () => boolean
}

export function useGraphLayout(options: LayoutOptions): Layout {
  const { containerRef, nodes, links, boxes, anchors, frame, still } = options
  const simulationRef = useRef<Simulation | null>(null)
  const runRef = useRef<() => void>(() => {})
  const draggedRef = useRef(false)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })

  // Layout, not effect: positions must be on the elements before the
  // browser paints, or every restructure shows one frame of every node
  // stacked at the centre. Nothing here runs on the server — the graph is
  // loaded client-side only.
  
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const t = transformRef.current;
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, t.scale * Math.exp(delta)), 5);
      
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;

      // Adjust x and y to zoom towards the mouse cursor
      t.x = cx - (cx - t.x) * (newScale / t.scale);
      t.y = cy - (cy - t.y) * (newScale / t.scale);
      t.scale = newScale;
      
      if (simulationRef.current) {
        paint(container, simulationRef.current, t);
      }
    };

    const handlePointerDown = (e: globalThis.PointerEvent) => {
      if ((e.target as Element).closest('[data-body]')) return; // handled by node startDrag
      
      let startX = e.clientX;
      let startY = e.clientY;
      const t = transformRef.current;
      draggedRef.current = false;
      
      const onMove = (me: globalThis.PointerEvent) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          draggedRef.current = true;
        }
        t.x += dx;
        t.y += dy;
        startX = me.clientX;
        startY = me.clientY;
        if (simulationRef.current) {
          paint(container, simulationRef.current, t);
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [containerRef]);

  useLayoutEffect(() => {
    const container = containerRef.current

    if (!container || !frame) return

    const simulation = simulationRef.current ?? createSimulation(frame)
    const warm = simulationRef.current !== null

    simulationRef.current = simulation
    simulation.frame = frame
    simulation.links = links
    simulation.anchors = anchors
    reconcile(simulation, nodes, boxes)
    reheat(simulation)

    let raf = 0
    const tick = () => {
      step(simulation)
      paint(container, simulation, transformRef.current)
      raf = isCool(simulation) ? 0 : requestAnimationFrame(tick)
    }

    runRef.current = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // The very first layout is fast-forwarded so the page opens on a
    // graph that already makes sense. Every change after that is worth
    // watching, because seeing the branches move is how you learn that
    // they push on each other.
    // if (!warm) settle(simulation, WARM_UP_TICKS)
    if (still) settle(simulation, SETTLE_TICKS)

    paint(container, simulation, transformRef.current)
    if (!still) runRef.current()

    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [containerRef, nodes, links, boxes, anchors, frame, still])

  const startDrag = useCallback(
    (id: string, event: PointerEvent) => {
      const simulation = simulationRef.current
      const container = containerRef.current

      if (!simulation || !container) return

      const body = simulation.bodies.get(id)

      if (!body) return

      const rect = container.getBoundingClientRect()
      const toLocalX = (clientX: number) => ((clientX - rect.left - simulation.frame.halfWidth) - transformRef.current.x) / transformRef.current.scale
      const toLocalY = (clientY: number) => ((clientY - rect.top - simulation.frame.halfHeight) - transformRef.current.y) / transformRef.current.scale
      const grabX = body.x - toLocalX(event.clientX)
      const grabY = body.y - toLocalY(event.clientY)
      const from = { x: event.clientX, y: event.clientY }

      draggedRef.current = false
      body.pinned = true

      const onMove = (moved: globalThis.PointerEvent) => {
        if (Math.hypot(moved.clientX - from.x, moved.clientY - from.y) > DRAG_THRESHOLD) {
          draggedRef.current = true
        }
        body.x = toLocalX(moved.clientX) + grabX
        body.y = toLocalY(moved.clientY) + grabY
        reheat(simulation, DRAG_ALPHA)
        runRef.current()
      }

      // Released, and immediately let go of: a nudged node drifts back
      // into whatever place the forces think it belongs.
      const onUp = () => {
        body.pinned = false
        setAlpha(simulation, RELEASE_ALPHA)
        runRef.current()
        window.removeEventListener('pointermove', onMove)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp, { once: true })
    },
    [containerRef]
  )

  // Reads once and clears. A click that followed a drag is swallowed;
  // a click from the keyboard, which had no drag before it, is not.
  const wasDragged = useCallback(() => {
    const dragged = draggedRef.current

    draggedRef.current = false
    return dragged
  }, [])

  return { startDrag, wasDragged }
}
