import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

const prisma = createClient()

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!password) throw new Error('SEED_ADMIN_PASSWORD env var is required')

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email: 'admin@ruimachalele.com' },
    update: {},
    create: {
      name: 'Rui Machalele',
      email: 'admin@ruimachalele.com',
      password: hashed,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('✔ Admin user created: admin@ruimachalele.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
