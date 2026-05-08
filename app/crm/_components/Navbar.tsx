import { auth } from '@/auth'
import { Bell, Search } from 'lucide-react'
import { NavbarTitle } from './NavbarTitle'

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

  return (
    <header className="flex h-[80px] items-center justify-between gap-4">
      <NavbarTitle />

      <div className="flex shrink-0 items-center gap-2">
        {/* Search */}
        <button
          type="button"
          aria-label="Buscar"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white text-[#8a8a8a] transition hover:text-[#080808] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]"
          title="Buscar"
        >
          <Search size={17} strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white text-[#8a8a8a] transition hover:text-[#080808] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]"
          title="Notificaciones"
        >
          <Bell size={17} strokeWidth={1.8} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#dfff00] border border-[#f7f8fa]" />
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-[#e5e7eb] mx-1" />

        {/* User pill */}
        <div className="flex items-center gap-2.5 bg-white rounded-full pl-3 pr-1.5 py-1.5">
          <span className="text-[13px] font-semibold text-[#080808]">{name}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#9bbdf7] text-[#080808] rounded-full px-2 py-0.5">
            {isAdmin ? 'Admin' : 'Editor'}
          </span>
          <div className="w-8 h-8 rounded-full bg-[#dfff00] flex items-center justify-center text-[11px] font-bold text-[#080808] flex-shrink-0">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
