import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * How many Postgres connections one instance of this app may hold open.
 *
 * One, deliberately. The ceiling is (instances × this number), and on
 * Supabase's *session* pooler the whole account gets 15 client slots — so
 * three apiece meant five warm serverless instances could take the lot
 * and every request after that died with EMAXCONNSESSION. A single-user
 * app does not need more than one connection per instance.
 *
 * The real cure is the transaction pooler on port 6543, which multiplexes
 * instead of holding a slot per client. See the README.
 */
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? 1)

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
    // Let an idle pool close rather than sit on a slot a cold instance needs.
    allowExitOnIdle: true,
  })

  return new PrismaClient({ adapter })
}

export const db: PrismaClient = cache.hibiDb ?? connect()

if (process.env.NODE_ENV !== 'production') cache.hibiDb = db
