import type { Link } from '@/lib/graph/body'

/**
 * The lines between nodes.
 *
 * Rendered once per shape change and never again — their endpoints are
 * written straight onto the elements by the simulation's paint step,
 * which is why each one carries the ids it joins.
 */
export function GraphEdges({ links }: { links: Link[] }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
      {links.map((link) => (
        <line
          key={`${link.source}->${link.target}`}
          data-link=""
          data-source={link.source}
          data-target={link.target}
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}
