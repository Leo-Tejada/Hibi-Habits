import { share } from '@/lib/format/number'
import type { Tally } from '@/types/home'
import { Eyebrow } from '../ui/eyebrow'
import { Figure } from '../ui/figure'
import { Meter } from '../ui/meter'
import { Panel } from '../ui/panel'
import { Readout } from '../ui/readout'

/** Skipped tasks were stood down on purpose, so they leave the count. */
function expected(tally: Tally): number {
  return tally.done + tally.pending
}

export function TodayPanel({ today, recent }: { today: Tally; recent: Tally }) {
  return (
    <Panel title="Today">
      <div className="grid grid-cols-3 gap-3">
        <Readout label="Done">{today.done}</Readout>
        <Readout label="Left">{today.pending}</Readout>
        <Readout label="Skipped">{today.skipped}</Readout>
      </div>

      <div className="mt-5 border-t border-line-soft pt-3">
        <div className="flex items-baseline justify-between">
          <Eyebrow>Last 7 days</Eyebrow>
          <Figure className="text-[11px] text-ink-dim">
            {recent.done}/{expected(recent)} · {share(recent.done, expected(recent))}%
          </Figure>
        </div>
        <Meter value={share(recent.done, expected(recent))} className="mt-2.5" />
      </div>
    </Panel>
  )
}
