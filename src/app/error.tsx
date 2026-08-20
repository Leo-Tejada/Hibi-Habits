'use client'

import { Card } from '@/components/ui/card'

/**
 * Something went wrong on the server — most often the database refusing a
 * connection. Saying so plainly beats a blank crash, and the retry costs
 * nothing when the cause was momentary.
 */
export default function ErrorScreen({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md px-8 py-8 text-center">
        <h1 className="text-[20px] font-bold tracking-[-0.02em]">This screen could not load</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
          Hibi could not reach its database. That is usually momentary — try again, and if it keeps
          happening the connection pool is likely full.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full border border-line px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-ink"
        >
          Try again
        </button>
      </Card>
    </div>
  )
}
