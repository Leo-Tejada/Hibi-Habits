type Timed = { start: number | null }

/**
 * Timed tasks belong in clock order; untimed ones stay where they were
 * dragged.
 *
 * The trick is to leave the *positions* alone and only re-seat the timed
 * tasks among the slots they already occupy. An untimed task keeps its
 * neighbours, so "Wash dishes" can sit between the 13:40 and the 19:30
 * and stay there when a new timed task appears.
 */
export function orderForDay<T extends Timed>(tasks: T[]): T[] {
  const slots = tasks.flatMap((task, index) => (task.start === null ? [] : [index]))
  const byClock = tasks
    .filter((task) => task.start !== null)
    .sort((left, right) => (left.start ?? 0) - (right.start ?? 0))
  const seated = [...tasks]

  slots.forEach((slot, index) => {
    seated[slot] = byClock[index]
  })
  return seated
}

/**
 * Which task is happening right now.
 *
 * An explicit end time is taken at its word. Without one, a task runs
 * until the next timed task begins — better than inventing a duration,
 * and it means a lone evening session does not stay lit until midnight
 * once something else is scheduled after it.
 */
export function endOfTask<T extends Timed & { end: number | null }>(
  tasks: T[],
  index: number,
  dayEnd: number
): number {
  const task = tasks[index]

  if (task.end !== null) return task.end

  const later = tasks
    .slice(index + 1)
    .find((candidate) => candidate.start !== null && candidate.start > (task.start ?? 0))

  return later?.start ?? dayEnd
}
