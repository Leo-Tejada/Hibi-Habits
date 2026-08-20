/** "01", "12" — season ordinals read as a series, so they keep the zero. */
export function padOrdinal(value: number): string {
  return String(value).padStart(2, '0')
}

export function percent(ratio: number): number {
  return Math.round(ratio * 100)
}

/** Share of `done` out of `total`, safe when nothing was expected. */
export function share(done: number, total: number): number {
  return total === 0 ? 0 : percent(done / total)
}
