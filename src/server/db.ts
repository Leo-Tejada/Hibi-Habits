import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * How many Postgres connections one instance of this app may hold open.
 *
 * node-postgres defaults to 10, which is far too many here. The database
 * sits behind Supabase's pooler, where every pooled connection occupies a
 * client slot, and every serverless instance brings its own pool — so the
 * ceiling is (instances × this number), not this number. A handful each is
 * plenty for a single-user app, and running out shows up as EMAXCONNS
 * rather than as anything that looks like a bug in a query.
 */
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? 3)

/** Give idle connections back quickly instead of holding a slot between requests. */
const IDLE_TIMEOUT_MS = 10_000

/**
 * One Prisma client for the process. Next.js reloads modules on every
 * edit in development, so the client is parked on `globalThis` to stop
 * each reload opening another pool against Postgres.
 */
const cache = globalThis as unknown as { hibiDb?: PrismaClient }

function connect(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) throw new Error('DATABASE_URL is not set')

  const adapter = new PrismaPg({
    connectionString,
    max: POOL_MAX,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
  })

  return new PrismaClient({ adapter })
}

export const db: PrismaClient = cache.hibiDb ?? connect()

if (process.env.NODE_ENV !== 'production') cache.hibiDb = db
