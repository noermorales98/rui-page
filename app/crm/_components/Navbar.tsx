import { auth } from '@/auth'
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

  return <NavbarClient name={name} initials={initials} isAdmin={isAdmin} />
}
