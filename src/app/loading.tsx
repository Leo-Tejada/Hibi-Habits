/** Shown while the season is read. Mirrors the real layout's blocks. */
function Block({ className = '' }: { className?: string }) {
  return <div className={`border border-line bg-panel ${className}`} />
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-5">
      <Block className="h-32" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-3 md:grid-cols-3">
          <Block className="h-64" />
          <Block className="h-64" />
          <Block className="h-64" />
        </div>
        <Block className="h-64" />
      </div>
    </div>
  )
}
