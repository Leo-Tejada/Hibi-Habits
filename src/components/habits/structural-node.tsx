import { paintFor, tierOf } from '@/lib/habits/node-paint'
import type { GraphNode } from '@/lib/habits/tree'

export function StructuralNode({
  node,
  width,
  height,
  collapsed,
  onToggle,
  onAdd,
  onAddQuest,
}: {
  node: GraphNode
  width: number
  height: number
  collapsed: boolean
  onToggle: (() => void) | null
  onAdd: (() => void) | null
  onAddQuest?: (() => void) | null
}) {
  const paint = paintFor(tierOf(node), node.category)
  const size = { width, height }
  const skin = {
    ...size,
    backgroundColor: paint.background,
    borderColor: collapsed ? paint.color : paint.borderColor,
    color: paint.color,
  }

  if (node.kind === 'root') {
    return (
      <div
        style={{ ...skin, borderColor: 'var(--line)' }}
        className="flex items-center justify-center border bg-ground/90 font-mono text-[13px] font-medium uppercase tracking-[0.14em] backdrop-blur-[2px]"
      >
        <span className="truncate px-1">{node.label}</span>
      </div>
    )
  }

  return (
    <div className="group relative" style={size}>
      <button
        type="button"
        onClick={onToggle ?? undefined}
        aria-expanded={!collapsed}
        title={collapsed ? `Show ${node.label}` : `Fold ${node.label} away`}
        style={skin}
        className={`flex items-center justify-center border font-mono text-[11px] uppercase tracking-[0.12em] ${
          collapsed ? 'border-dashed' : ''
        }`}
      >
        <span className="truncate px-1">{node.label}</span>
      </button>

      {onAdd ? <AddButton area={node.label} tone={paint.color} onAdd={onAdd} type="habit" /> : null}
      {onAddQuest ? <AddButton area={node.label} tone={paint.color} onAdd={onAddQuest} type="quest" /> : null}
    </div>
  )
}

function AddButton({ area, tone, onAdd, type }: { area: string; tone: string; onAdd: () => void; type: 'habit' | 'quest' }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      title={`New ${type} in ${area}`}
      style={{ color: tone }}
      // Hover reveals it on a mouse, but a touch screen has no hover at
      // all, so on a coarse pointer it is simply always there. Keyboard
      // focus reveals it either way.
      className={`absolute ${
        type === 'habit' ? 'right-0.5' : 'left-0.5'
      } top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center font-mono text-[13px] leading-none opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100`}
    >
      +<span className="sr-only">New {type} in {area}</span>
    </button>
  )
}
