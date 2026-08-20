import { shortDate } from '@/lib/dates/format'
import { percent } from '@/lib/format/number'
import type { CalendarMonth } from '@/lib/seasons/calendar'
import type { SeasonHeader } from '@/types/home'
import { Eyebrow } from '../ui/eyebrow'
import { Readout } from '../ui/readout'
import { SeasonCalendar } from './season-calendar'

function Readouts({ season }: { season: SeasonHeader }) {
  if (season.standing === 'future') {
    return (
      <Readout label="Opens in">
        {season.daysUntilStart}
        <span className="text-ink-faint"> days</span>
      </Readout>
    )
  }

  if (season.standing === 'past') {
    return (
      <Readout label="Closed">
        {season.totalDays}
        <span className="text-ink-faint"> days</span>
      </Readout>
    )
  }

  return (
    <>
      <Readout label="Day">
        {season.dayIndex}
        <span className="text-ink-faint"> / {season.totalDays}</span>
      </Readout>
      <Readout label="Days left">{season.daysLeft}</Readout>
      <Readout label="Elapsed">
        {percent(season.elapsed)}
        <span className="text-ink-faint">%</span>
      </Readout>
    </>
  )
}

export function SeasonPanel({
  season,
  months,
}: {
  season: SeasonHeader
  months: CalendarMonth[]
}) {
  return (
    <section className="border border-line bg-panel px-5 pt-4 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="flex items-baseline gap-3">
          <Eyebrow className="text-ink-dim">{season.label}</Eyebrow>
          <h2 className="text-[16px] leading-none tracking-[-0.01em]">
            {season.name ?? `${shortDate(season.startsOn)} – ${shortDate(season.endsOn)}`}
          </h2>
          {!season.id && (
            <span className="text-[11px] text-ink-faint">no season set for this quarter</span>
          )}
        </div>
        <div className="flex items-end gap-9">
          <Readouts season={season} />
        </div>
      </div>

      <div className="mt-6">
        <SeasonCalendar months={months} />
      </div>
    </section>
  )
}
