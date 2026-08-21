/**
 * A filled bar. `tone` carries the category hue; everything else is ink.
 *
 * The default is spelled out rather than left to a token of its own. It
 * used to fall back to `--activity`, which was never defined in
 * `globals.css`, so every bar drawn without a tone resolved to no colour
 * at all and rendered as an empty track.
 */
export function Meter({
  value,
  tone,
  className = '',
}: {
  value: number
  tone?: string
  className?: string
}) {
  return (
    <div className={`relative h-1.5 w-full overflow-hidden bg-line-soft ${className}`}>
      <span
        className="absolute inset-y-0 left-0"
        style={{ width: `${value}%`, background: tone ?? 'var(--ink)' }}
      />
    </div>
  )
}
