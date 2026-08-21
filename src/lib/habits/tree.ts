import type { Subcategory } from '@/generated/prisma/enums'
import type { Link } from '@/lib/graph/body'
import { fanAngle } from '@/lib/graph/seed'
import {
  CATEGORIES,
  areaLabel,
  areasOf,
  categoryLabel,
  categoryOf,
  type Category,
} from '@/lib/taxonomy'
import type { HabitNodeView, QuestNodeView } from '@/types/habits'

export type GraphNodeKind = 'root' | 'category' | 'area' | 'quest' | 'habit' | 'pending'

export type GraphNode = {
  id: string
  kind: GraphNodeKind
  label: string
  category: Category | null
  area: Subcategory | null
  habit: HabitNodeView | null
  quest: QuestNodeView | null
  depth: number
  seedAngle: number
}

export type Graph = { nodes: GraphNode[]; links: Link[] }

export const ROOT_ID = 'root'
export const PENDING_ID = 'pending'

export function categoryNodeId(category: Category): string {
  return `category:${category}`
}

export function areaNodeId(area: Subcategory): string {
  return `area:${area}`
}

export function questNodeId(questId: string): string {
  return `quest:${questId}`
}

export function habitNodeId(habitId: string): string {
  return `habit:${habitId}`
}

export function isStructural(kind: GraphNodeKind): boolean {
  return kind === 'root' || kind === 'category' || kind === 'area'
}

/**
 * Edge rest length, indexed by the *parent's* depth, and the seed radius
 * of each ring. The two are one fact written twice, so the second is
 * derived from the first: when quests were inserted at depth 3 the link
 * distances grew an entry and the radii did not, which left every quest
 * and habit seeded 35px inside the ring its own spring wanted.
 */
const LINK_DISTANCE = [200, 135, 135, 100]
const RING_RADIUS = LINK_DISTANCE.reduce<number[]>(
  (rings, gap) => [...rings, rings[rings.length - 1] + gap],
  [0]
)

const FIRST_CATEGORY_ANGLE = -Math.PI / 2
const CATEGORY_SPREAD = (Math.PI * 2) / CATEGORIES.length
const AREA_SPREAD = 0.42

/**
 * Siblings are fanned by an angle, so the arc between two of them grows
 * with the radius of the ring they sit on. A quest at depth 3 and a
 * habit at depth 4 sharing one spread would therefore be spaced quite
 * differently, and the deeper ring — the crowded one — would get less
 * room, not more. Spacing is specified as an arc in pixels and turned
 * into an angle per ring instead.
 */
const SIBLING_ARC = 132

function spreadOn(depth: number): number {
  return SIBLING_ARC / ringRadiusFor(depth)
}

export function ringRadiusFor(depth: number): number {
  return RING_RADIUS[Math.min(depth, RING_RADIUS.length - 1)]
}

function linkTo(source: string, target: string, parentDepth: number): Link {
  return { source, target, distance: LINK_DISTANCE[Math.min(parentDepth, LINK_DISTANCE.length - 1)] }
}

export type BuildOptions = {
  habits: HabitNodeView[]
  quests: QuestNodeView[]
  collapsed: ReadonlySet<string>
  pendingArea: Subcategory | null
  pendingKind: 'habit' | 'quest' | null
}

export function buildGraph(options: BuildOptions): Graph {
  const nodes: GraphNode[] = [
    {
      id: ROOT_ID,
      kind: 'root',
      label: 'You',
      category: null,
      area: null,
      habit: null,
      quest: null,
      depth: 0,
      seedAngle: 0,
    },
  ]
  const links: Link[] = []

  CATEGORIES.forEach((category, index) => {
    const id = categoryNodeId(category)
    const angle = FIRST_CATEGORY_ANGLE + index * CATEGORY_SPREAD

    nodes.push({
      id,
      kind: 'category',
      label: categoryLabel(category),
      category,
      area: null,
      habit: null,
      quest: null,
      depth: 1,
      seedAngle: angle,
    })
    links.push(linkTo(ROOT_ID, id, 0))

    if (options.collapsed.has(id)) return

    const areas = areasOf(category)

    areas.forEach((area, position) => {
      addArea(area, id, fanAngle(angle, position, areas.length, AREA_SPREAD), options, nodes, links)
    })
  })

  return { nodes, links }
}

function addArea(
  area: Subcategory,
  parentId: string,
  angle: number,
  options: BuildOptions,
  nodes: GraphNode[],
  links: Link[]
): void {
  const id = areaNodeId(area)

  nodes.push({
    id,
    kind: 'area',
    label: areaLabel(area),
    category: categoryOf(area),
    area,
    habit: null,
    quest: null,
    depth: 2,
    seedAngle: angle,
  })
  links.push(linkTo(parentId, id, 1))

  if (options.collapsed.has(id)) return

  const areaQuests = options.quests.filter((q) => q.subcategory === area)
  // habits directly under area
  const areaHabits = options.habits.filter((h) => h.subcategory === area && !h.questId)
  
  const pending = options.pendingArea === area
  const totalItems = areaQuests.length + areaHabits.length + (pending ? 1 : 0)
  
  let currentPos = 0;

  areaQuests.forEach((quest) => {
    const itemAngle = fanAngle(angle, currentPos++, totalItems, spreadOn(3))
    addQuest(quest, id, itemAngle, options, nodes, links)
  })

  areaHabits.forEach((habit) => {
    const itemAngle = fanAngle(angle, currentPos++, totalItems, spreadOn(3))
    addHabit(habit, id, itemAngle, nodes, links, 3)
  })

  if (pending) {
    const angleAt = fanAngle(angle, currentPos, totalItems, spreadOn(3))

    addPending(area, id, angleAt, nodes, links, options.pendingKind ?? 'habit')
  }
}

function addQuest(
  quest: QuestNodeView,
  parentId: string,
  angle: number,
  options: BuildOptions,
  nodes: GraphNode[],
  links: Link[]
): void {
  const id = questNodeId(quest.id)
  nodes.push({
    id,
    kind: 'quest',
    label: quest.title,
    category: categoryOf(quest.subcategory),
    area: quest.subcategory,
    habit: null,
    quest,
    depth: 3,
    seedAngle: angle,
  })
  links.push(linkTo(parentId, id, 2))

  if (options.collapsed.has(id)) return

  const questHabits = options.habits.filter((h) => h.questId === quest.id)
  questHabits.forEach((habit, pos) => {
    addHabit(habit, id, fanAngle(angle, pos, questHabits.length, spreadOn(4)), nodes, links, 4)
  })
}

function addHabit(
  habit: HabitNodeView,
  parentId: string,
  angle: number,
  nodes: GraphNode[],
  links: Link[],
  depth: number
): void {
  const id = habitNodeId(habit.id)

  nodes.push({
    id,
    kind: 'habit',
    label: habit.title,
    category: categoryOf(habit.subcategory),
    area: habit.subcategory,
    habit,
    quest: null,
    depth,
    seedAngle: angle,
  })
  links.push(linkTo(parentId, id, depth - 1))
}

function addPending(
  area: Subcategory,
  parentId: string,
  angle: number,
  nodes: GraphNode[],
  links: Link[],
  kind: 'habit' | 'quest'
): void {
  nodes.push({
    id: PENDING_ID,
    kind: 'pending',
    label: kind === 'habit' ? 'New habit' : 'New side quest',
    category: categoryOf(area),
    area,
    habit: null,
    quest: null,
    depth: 3,
    seedAngle: angle,
  })
  links.push(linkTo(parentId, PENDING_ID, 2))
}
