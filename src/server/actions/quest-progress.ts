'use server'

import { revalidatePath } from 'next/cache'
import { clampProgress } from '@/lib/quests/rules'
import { currentUser } from '../current-user'
import { db } from '../db'

/**
 * Quest progress is self-rated: the user says how far along they are and
 * nothing derives it for them.
 *
 * Server actions answer plain POSTs, not just this app's own UI, so the
 * owner check belongs in the `where` clause rather than in the caller.
 */
export async function setQuestProgress(questId: string, progress: number): Promise<void> {
  const user = await currentUser()

  await db.quest.updateMany({
    where: { id: questId, userId: user.id },
    data: { progress: clampProgress(progress) },
  })

  revalidatePath('/')
}
