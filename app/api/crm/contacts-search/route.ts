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
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
      orderBy: { name: 'asc' },
    })

    return Response.json(contacts)
  } catch {
    return Response.json([], { status: 500 })
  }
}
