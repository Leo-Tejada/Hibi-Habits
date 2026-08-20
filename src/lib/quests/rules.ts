import { QuestKind, QuestStatus, type Subcategory } from '@/generated/prisma/enums'
import { categoryOf, type Category } from '@/lib/taxonomy'

/** Self-rated progress is a whole percentage and nothing else. */
export const PROGRESS_MIN = 0
export const PROGRESS_MAX = 100
export const PROGRESS_STEP = 5

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return PROGRESS_MIN
  return Math.min(PROGRESS_MAX, Math.max(PROGRESS_MIN, Math.round(value)))
}

type QuestSlot = { kind: QuestKind; subcategory: Subcategory }

/**
 * A season holds exactly one main quest per category. Side quests are
 * unlimited. Enforced here rather than by a database constraint, because
 * the rule is about MAIN rows only and Prisma cannot express a partial
 * unique index without the migration drifting from the schema.
 */
export function mainQuestSlotTaken(existing: QuestSlot[], category: Category): boolean {
  return existing.some(
    (quest) => quest.kind === QuestKind.MAIN && categoryOf(quest.subcategory) === category
  )
}

export function canAddMainQuest(existing: QuestSlot[], area: Subcategory): boolean {
  return !mainQuestSlotTaken(existing, categoryOf(area))
}

const STATUS_LABELS: Record<QuestStatus, string> = {
  ACTIVE: '',
  COMPLETED: 'Completed',
  ABANDONED: 'Let go',
}

/** Empty for a live quest — there is nothing to say about it yet. */
export function questStatusLabel(status: QuestStatus): string {
  return STATUS_LABELS[status]
}
