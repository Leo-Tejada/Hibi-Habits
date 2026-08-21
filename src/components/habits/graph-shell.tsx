'use client'

import dynamic from 'next/dynamic'
import type { HabitsView } from '@/types/habits'

/**
 * The graph is loaded in the browser and nowhere else.
 *
 * There is nothing to server-render: every node's position comes out of
 * a simulation that needs a measured container, so a server pass would
 * only emit thirteen boxes piled at the origin for the client to move a
 * moment later. Skipping it also lets the layout run before first paint.
 */
const HabitGraph = dynamic(() => import('./habit-graph').then((module) => module.HabitGraph), {
  ssr: false,
})

export function GraphShell({ view }: { view: HabitsView }) {
  return <HabitGraph view={view} />
}
