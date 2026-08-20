import { Subcategory } from '@/generated/prisma/enums'

/**
 * The foundation of Hibi Habits: three categories, three areas each.
 * Nothing here is user-editable, which is why it lives in code and not
 * in a table.
 */
export const CATEGORIES = ['HEALTH', 'RELATIONSHIPS', 'INDEPENDENCE'] as const

export type Category = (typeof CATEGORIES)[number]

const AREAS: Record<Category, readonly Subcategory[]> = {
  HEALTH: [Subcategory.MIND, Subcategory.BODY, Subcategory.SPIRIT],
  RELATIONSHIPS: [Subcategory.LOVE, Subcategory.FAMILY, Subcategory.FRIENDS],
  INDEPENDENCE: [Subcategory.WORK, Subcategory.GROWTH, Subcategory.MONEY],
}

const CATEGORY_LABELS: Record<Category, string> = {
  HEALTH: 'Health',
  RELATIONSHIPS: 'Relationships',
  INDEPENDENCE: 'Independence',
}

const SUBCATEGORY_LABELS: Record<Subcategory, string> = {
  MIND: 'Mind',
  BODY: 'Body',
  SPIRIT: 'Spirit',
  LOVE: 'Love',
  FAMILY: 'Family',
  FRIENDS: 'Friends',
  WORK: 'Work',
  GROWTH: 'Growth',
  MONEY: 'Money',
}

/** The three areas that belong to a category. */
export function areasOf(category: Category): readonly Subcategory[] {
  return AREAS[category]
}

/** The category an area belongs to. Every area has exactly one. */
export function categoryOf(area: Subcategory): Category {
  const owner = CATEGORIES.find((category) => AREAS[category].includes(area))

  if (!owner) throw new Error(`Area ${area} belongs to no category`)
  return owner
}

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category]
}

export function areaLabel(area: Subcategory): string {
  return SUBCATEGORY_LABELS[area]
}

/** The category's hue, ready for a `style` prop. Defined in `globals.css`. */
export function categoryColor(category: Category): string {
  return `var(--${category.toLowerCase()})`
}
