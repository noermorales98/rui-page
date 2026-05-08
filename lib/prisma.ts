import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  // Parse mysql://user:pass@host:port/db
  const parsed = new URL(url)
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit: 1,
  })

  return new PrismaClient({ adapter, log: ['error'] })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma
  const staleDelegate =
    process.env.NODE_ENV !== 'production' &&
    cached != null &&
    typeof cached.crmForm?.findMany !== 'function'

  if (staleDelegate) {
    void cached.$disconnect().catch(() => {})
    delete globalForPrisma.prisma
  } else if (cached != null) {
    return cached
  }

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client
  return client
}

export const prisma = getPrismaClient()
