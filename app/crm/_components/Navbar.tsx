import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NavbarClient } from './NavbarClient'

export default async function Navbar() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  let user: { name: string | null; image: string | null } | null = null
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { name: true, image: true },
    })
  }

  const name = user?.name ?? session?.user?.name ?? ''
  const image = user?.image ?? null
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return <NavbarClient name={name} initials={initials} isAdmin={isAdmin} image={image} />
}
