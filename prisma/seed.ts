import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

type SeedUser = {
  name: string
  email: string
  password: string
  role: Role
}

const USERS: readonly SeedUser[] = [
  { name: 'Admin Demo',     email: 'admin@crm.local',     password: 'admin1234',     role: Role.ADMIN },
  { name: 'Vendedor Demo',  email: 'vendedor@crm.local',  password: 'vendedor1234',  role: Role.VENDEDOR },
  { name: 'Asistente Demo', email: 'asistente@crm.local', password: 'asistente1234', role: Role.ASISTENTE },
]

function createClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const parsed = new URL(url)
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  })

  return new PrismaClient({ adapter })
}

async function main() {
  const prisma = createClient()
  try {
    const canonicalEmails = USERS.map((u) => u.email)

    // Drop any non-canonical users so the seed is reproducible across envs.
    const removed = await prisma.user.deleteMany({
      where: { email: { notIn: canonicalEmails } },
    })
    if (removed.count > 0) {
      console.log(`✔ Removed ${removed.count} non-canonical user(s).`)
    }

    for (const u of USERS) {
      const hashed = await bcrypt.hash(u.password, 12)
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          password: hashed,
          role: u.role,
          active: true,
          deletedAt: null,
        },
        create: {
          name: u.name,
          email: u.email,
          password: hashed,
          role: u.role,
          active: true,
        },
      })
      console.log(`✔ Upserted ${u.email} (${u.role}).`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
