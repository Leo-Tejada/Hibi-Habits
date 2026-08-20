import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * One Prisma client for the process. Next.js reloads modules on every
 * edit in development, so the client is parked on `globalThis` to stop
 * each reload opening a new pool against Postgres.
 */
const cache = globalThis as unknown as { hibiDb?: PrismaClient }

function connect(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) throw new Error('DATABASE_URL is not set')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

export const db: PrismaClient = cache.hibiDb ?? connect()

if (process.env.NODE_ENV !== 'production') cache.hibiDb = db
