import { Eyebrow } from '@/components/ui/eyebrow'
import type { HabitNodeView } from '@/types/habits'

/**
 * What a habit node becomes when you open it.
 *
 * Deliberately empty. This is the shell that Journal entries and Quests
 * will also be read in, and the shape of that shell should be decided
 * once, against all three, rather than three times against one. The
 * frame is here; the contents are not.
 */
export function HabitCard({
  habit,
  seasonLabel,
  onClose,
}: {
  habit: HabitNodeView
  seasonLabel: string
  onClose: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-2.5">
        <div className="min-w-0">
          <Eyebrow>{seasonLabel}</Eyebrow>
          <h2 className="truncate text-[15px] leading-tight">{habit.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 font-mono text-[13px] leading-none text-ink-faint hover:text-ink"
        >
          ×<span className="sr-only">Close</span>
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          Nothing here yet
        </p>
      </div>
    </div>
  )
}
