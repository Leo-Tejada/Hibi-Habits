import { questStatusLabel } from '@/lib/quests/rules'
import { areaLabel, categoryColor } from '@/lib/taxonomy'
import type { QuestCard } from '@/types/home'
import { Eyebrow } from '../ui/eyebrow'
import { Figure } from '../ui/figure'
import { SectionHead } from '../ui/section-head'
import { QuestProgress } from './quest-progress'

function SideQuestRow({ quest }: { quest: QuestCard }) {
  const tone = categoryColor(quest.category)

  return (
    <li className="grid grid-cols-1 gap-3 py-3.5 md:grid-cols-[7rem_minmax(0,1fr)_4.5rem_11rem] md:items-center md:gap-6">
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0" style={{ background: tone }} />
        <Eyebrow className="text-ink-dim">{areaLabel(quest.area)}</Eyebrow>
      </span>

      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <h4 className="truncate text-[15px] leading-snug tracking-[-0.01em]">{quest.title}</h4>
          {questStatusLabel(quest.status) && (
            <Eyebrow className="shrink-0 text-ink-dim">{questStatusLabel(quest.status)}</Eyebrow>
          )}
        </div>
        {quest.intent && <p className="truncate text-[11px] text-ink-faint">{quest.intent}</p>}
      </div>

      <Figure className="text-[11px] text-ink-dim">
        {quest.recentTotal > 0 ? `${quest.recentDone}/${quest.recentTotal}` : ''}
      </Figure>

      <QuestProgress
        questId={quest.id}
        questTitle={quest.title}
        initial={quest.progress}
        tone={tone}
      />
    </li>
  )
}

export function SideQuests({ quests }: { quests: QuestCard[] }) {
  return (
    <section>
      <SectionHead title="Side quests"/>
      {quests.length === 0 ? (
        <p className="py-3 text-[12px] text-ink-faint">
          None this season. Side quests are the things worth doing that the main three do not cover.
        </p>
      ) : (
        <ul className="divide-y divide-line-soft border-y border-line-soft">
          {quests.map((quest) => (
            <SideQuestRow key={quest.id} quest={quest} />
          ))}
        </ul>
      )}
    </section>
  )
}
