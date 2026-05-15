import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NavbarClient } from './NavbarClient'

export default async function Navbar() {
  const session = await auth()
  const name = session?.user?.name ?? ''
  const isAdmin = session?.user?.role === 'ADMIN'
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Fetch image directly from DB so navbar updates immediately after avatar change
  let image: string | null = null
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { image: true },
    })
    image = user?.image ?? null
  }

  return <NavbarClient name={name} initials={initials} isAdmin={isAdmin} image={image} />
}
