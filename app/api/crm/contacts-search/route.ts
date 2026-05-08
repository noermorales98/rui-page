import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json([], { status: 401 })

  const raw = request.nextUrl.searchParams.get('q') ?? ''
  const q = raw.trim().slice(0, 100)

  if (!q) return Response.json([])

  try {
    const pattern = `%${q}%`
    const contacts = await prisma.$queryRaw<{ id: number; name: string; email: string }[]>`
      SELECT id, name, email FROM Contact
      WHERE name LIKE ${pattern} OR email LIKE ${pattern}
      ORDER BY name ASC
      LIMIT 10
    `

    return Response.json(contacts)
  } catch {
    return Response.json([], { status: 500 })
  }
}
