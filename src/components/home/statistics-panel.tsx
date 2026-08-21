import { categoryColor, categoryLabel, type Category } from '@/lib/taxonomy'
import type { AreaCompletion } from '@/types/home'
import { Eyebrow } from '../ui/eyebrow'
import { Figure } from '../ui/figure'
import { Meter } from '../ui/meter'
import { Panel } from '../ui/panel'

/**
 * How the season answered, one row per area of life.
 *
 * The figure is the share of this season's habit tasks that got done.
 * Errands that hang off no habit are left out of it — they belong to no
 * area, so they are not evidence about one.
 *
 * An area with nothing asked of it shows a dash rather than a nought.
 * Zero is a thing you earned; nothing is not.
 */
export function StatisticsPanel({ areas }: { areas: AreaCompletion[] }) {
  const byCategory = group(areas)

  return (
    <Panel title="Statistics" aside={<Eyebrow>Season</Eyebrow>}>
      <div className="flex flex-col gap-4">
        {byCategory.map(([category, rows]) => (
          <CategoryBlock key={category} category={category} rows={rows} />
        ))}
      </div>
    </Panel>
  )
}

/** Keeps taxonomy order, since `areas` already arrives in it. */
function group(areas: AreaCompletion[]): [Category, AreaCompletion[]][] {
  const blocks = new Map<Category, AreaCompletion[]>()

  for (const row of areas) {
    const found = blocks.get(row.category)

    if (found) found.push(row)
    else blocks.set(row.category, [row])
  }
  return [...blocks]
}

function CategoryBlock({ category, rows }: { category: Category; rows: AreaCompletion[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow style={{ color: categoryColor(category) }}>{categoryLabel(category)}</Eyebrow>

      {rows.map((row) => (
        <AreaRow key={row.area} row={row} />
      ))}
    </div>
  )
}

function AreaRow({ row }: { row: AreaCompletion }) {
  const share = row.share

  return (
    <div className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2">
      <span className="truncate text-[12px] text-ink-dim">{row.label}</span>

      <Meter
        value={share === null ? 0 : share * 100}
        tone={categoryColor(row.category)}
        className={share === null ? 'opacity-40' : ''}
      />

      <Figure className="text-right text-[11px] text-ink-dim">
        {share === null ? '—' : `${Math.round(share * 100)}%`}
      </Figure>
    </div>
  )
}
