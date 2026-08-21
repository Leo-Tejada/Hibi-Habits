import { questStatusLabel } from '@/lib/quests/rules'
import { areaLabel, categoryColor, categoryLabel, type Category } from '@/lib/taxonomy'
import type { QuestCard } from '@/types/home'
import { Eyebrow } from '../ui/eyebrow'
import { Reading } from '../ui/reading'
import { QuestProgress } from './quest-progress'

function Origin({ category, area }: { category: Category; area: QuestCard['area'] }) {
  return (
    <span className="flex items-center gap-1.5">
      <Eyebrow style={{ color: categoryColor(category) }}>{categoryLabel(category)}</Eyebrow>
      <Eyebrow>·</Eyebrow>
      <Eyebrow className="text-ink-dim">{areaLabel(area)}</Eyebrow>
    </span>
  )
}

export function MainQuestCard({ quest }: { quest: QuestCard }) {
  const tone = categoryColor(quest.category)

  return (
    <article className="relative flex h-full flex-col border border-line bg-panel p-5">
      <span className="absolute inset-x-0 top-0 h-px" style={{ background: tone }} />

      <div className="flex items-center justify-between gap-3">
        <Origin category={quest.category} area={quest.area} />
        {questStatusLabel(quest.status) && (
          <Eyebrow className="shrink-0 text-ink-dim">{questStatusLabel(quest.status)}</Eyebrow>
        )}
      </div>
      <h3 className="mt-3 text-[20px] leading-[1.2] tracking-[-0.02em]">{quest.title}</h3>
      {quest.intent && (
        <p className="mt-2 text-[12px] leading-relaxed text-ink-dim">{quest.intent}</p>
      )}

      {/* Titles wrap to different depths; the readings below still line up. */}
      <div className="flex-1" />

      <div className="mt-6 pt-2">
        <Eyebrow>Progress</Eyebrow>
        <div className="mt-2">
          <QuestProgress
            questId={quest.id}
            questTitle={quest.title}
            initial={quest.progress}
            tone={tone}
            scale="lg"
          />
        </div>
      </div>

      <footer className="mt-5 flex flex-wrap items-baseline justify-between gap-3 border-t border-line-soft pt-3">
        <Reading label="Habit">{quest.habitTitle ?? 'Loose'}</Reading>
        {/* Nothing was expected, so there is nothing to report. */}
        {quest.recentTotal > 0 && (
          <Reading label="Last 7 days">
            {quest.recentDone}/{quest.recentTotal}
          </Reading>
        )}
      </footer>
    </article>
  )
}

/** A category with no main quest this season. Every season wants three. */
export function VacantQuestCard({ category }: { category: Category }) {
  return (
    <article className="flex flex-col border border-dashed border-line p-5">
      <Eyebrow style={{ color: categoryColor(category) }}>{categoryLabel(category)}</Eyebrow>
      <h3 className="mt-3 text-[20px] leading-[1.2] tracking-[-0.02em] text-ink-dim">
        No main quest set
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
        A season carries one main quest for {categoryLabel(category).toLowerCase()}. Set it at the
        start and leave it alone until the season closes.
      </p>
    </article>
  )
}
