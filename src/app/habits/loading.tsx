/**
 * Shown while the graph's data is read.
 *
 * The root `loading.tsx` draws the homepage's panel skeleton, which is
 * three stacked rectangles and looks nothing like this screen — a cold
 * compile flashed a page layout that never arrives. The graph has no
 * skeleton worth drawing either, since where anything sits is not known
 * until the simulation has run, so this is deliberately just the empty
 * field the graph will appear in.
 */
export default function Loading() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          Drawing the graph
        </span>
      </div>
    </div>
  )
}
