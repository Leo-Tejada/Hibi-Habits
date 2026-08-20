import { CATEGORIES } from '@/lib/taxonomy'
import type { QuestCard } from '@/types/home'
import { SectionHead } from '../ui/section-head'
import { MainQuestCard, VacantQuestCard } from './main-quest-card'

/**
 * Always three columns, one per category, whether or not a quest fills
 * them. An empty slot is the point: it shows a part of life going
 * unclaimed this season.
 */
export function MainQuests({ quests }: { quests: QuestCard[] }) {
  return (
    <section>
      <SectionHead title="Main quests" note="One per category, fixed for the season" />
      <div className="grid gap-3 md:grid-cols-3">
        {CATEGORIES.map((category) => {
          const quest = quests.find((candidate) => candidate.category === category)

          return quest ? (
            <MainQuestCard key={category} quest={quest} />
          ) : (
            <VacantQuestCard key={category} category={category} />
          )
        })}
      </div>
    </section>
  )
}
