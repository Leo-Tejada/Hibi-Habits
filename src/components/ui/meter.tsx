/** A filled bar. `tone` carries the category hue; everything else is ink. */
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
        style={{ width: `${value}%`, background: tone ?? 'var(--activity)' }}
      />
    </div>
  )
}
