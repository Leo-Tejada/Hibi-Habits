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
 *
 * The pyramid reads Category > Subcategory > Habit > Quest, and the last
 * gap — habit to quest — is the shortest on purpose: a quest is an
 * extension of its practice, not a neighbour of it.
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
  /** Set while naming a side quest under the habit that will serve it. */
  pendingHabitId: string | null
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

  // Every habit of the area hangs directly off it, whether or not it
  // serves a quest.
  const areaHabits = options.habits.filter((habit) => habit.subcategory === area)
  // Loose quests live beside the habits; a quest with a habit hangs off
  // that habit instead (see addHabit).
  const areaQuests = options.quests.filter(
    (quest) => quest.habitId === null && quest.subcategory === area
  )
  const pending = options.pendingArea === area && options.pendingHabitId === null
  const totalItems = areaHabits.length + areaQuests.length + (pending ? 1 : 0)

  let currentPos = 0

  areaQuests.forEach((quest) => {
    const itemAngle = fanAngle(angle, currentPos++, totalItems, spreadOn(3))
    addQuest(quest, id, itemAngle, nodes, links, quest.subcategory!, 3)
  })

  areaHabits.forEach((habit) => {
    const itemAngle = fanAngle(angle, currentPos++, totalItems, spreadOn(3))
    addHabit(habit, id, itemAngle, options, nodes, links)
  })

  if (pending) {
    const angleAt = fanAngle(angle, currentPos, totalItems, spreadOn(3))

    addPending(area, id, angleAt, nodes, links, options.pendingKind ?? 'habit', 3)
  }
}

/**
 * A quest node: the goal its habit is earning, or — loose — a goal that
 * stands on its own beside the habits of its area. Nothing hangs below a
 * goal, so the quest carries no children of its own.
 */
function addQuest(
  quest: QuestNodeView,
  parentId: string,
  angle: number,
  nodes: GraphNode[],
  links: Link[],
  area: Subcategory,
  depth: number
): void {
  const id = questNodeId(quest.id)

  nodes.push({
    id,
    kind: 'quest',
    label: quest.title,
    category: categoryOf(area),
    area,
    habit: null,
    quest,
    depth,
    seedAngle: angle,
  })
  links.push(linkTo(parentId, id, depth - 1))
}

function addHabit(
  habit: HabitNodeView,
  parentId: string,
  angle: number,
  options: BuildOptions,
  nodes: GraphNode[],
  links: Link[]
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
    depth: 3,
    seedAngle: angle,
  })
  links.push(linkTo(parentId, id, 2))

  // The quests this habit serves hang off it — the last rung of the
  // pyramid — and take its area.
  const quests = options.quests.filter((quest) => quest.habitId === habit.id)
  const pending = options.pendingHabitId === habit.id && options.pendingKind === 'quest'
  const totalItems = quests.length + (pending ? 1 : 0)

  quests.forEach((quest, position) => {
    addQuest(
      quest,
      id,
      fanAngle(angle, position, totalItems, spreadOn(4)),
      nodes,
      links,
      habit.subcategory,
      4
    )
  })

  if (pending) {
    const angleAt = fanAngle(angle, quests.length, totalItems, spreadOn(4))

    addPending(habit.subcategory, id, angleAt, nodes, links, 'quest', 4)
  }
}

function addPending(
  area: Subcategory,
  parentId: string,
  angle: number,
  nodes: GraphNode[],
  links: Link[],
  kind: 'habit' | 'quest',
  depth: number
): void {
  nodes.push({
    id: PENDING_ID,
    kind: 'pending',
    label: kind === 'habit' ? 'New habit' : 'New side quest',
    category: categoryOf(area),
    area,
    habit: null,
    quest: null,
    depth,
    seedAngle: angle,
  })
  links.push(linkTo(parentId, PENDING_ID, depth - 1))
}
