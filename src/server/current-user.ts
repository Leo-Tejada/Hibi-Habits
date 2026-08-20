import { cache } from 'react'
import { db } from './db'

/**
 * Hibi has no sign-in yet, so "the current user" is the single row the
 * seed creates. Every query is still scoped by `userId`, which is the
 * whole point: when authentication arrives, only this function changes.
 */
export const currentUser = cache(async () => {
  const user = await db.user.findFirst({ orderBy: { createdAt: 'asc' } })

  if (!user) throw new Error('No user found. Run `npm run db:seed`.')
  return user
})
