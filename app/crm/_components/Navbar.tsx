import { auth } from '@/auth'
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
    <header className="h-[68px] flex items-center justify-between">
      <NavbarTitle />

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="w-10 h-10 rounded-full bg-white border-none flex items-center justify-center text-[#8a8a8a] hover:text-[#080808] transition cursor-pointer shadow-sm"
          title="Buscar"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17.5 17.5L22 22" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 11C20 6.03 15.97 2 11 2C6.03 2 2 6.03 2 11C2 15.97 6.03 20 11 20C15.97 20 20 15.97 20 11Z" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Notifications */}
        <button
          className="relative w-10 h-10 rounded-full bg-white border-none flex items-center justify-center text-[#8a8a8a] hover:text-[#080808] transition cursor-pointer shadow-sm"
          title="Notificaciones"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5.32 8.4C5.69 4.8 8.66 2 12.32 2C16.1 2 19.18 5.08 19.18 8.86V9.4C19.18 12.62 19.9 14.48 20.79 15.55C21.24 16.09 21.47 16.37 21.45 16.64C21.43 16.91 21.26 17.15 20.91 17.62C20.47 18.22 19.74 18.22 18.29 18.22H6.35C4.9 18.22 4.17 18.22 3.73 17.62C3.38 17.15 3.21 16.91 3.19 16.64C3.17 16.37 3.4 16.09 3.85 15.55C4.74 14.48 5.46 12.62 5.46 9.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 18.22C9.28 19.47 10.53 20.4 12.12 20.4C13.71 20.4 14.96 19.47 15.24 18.22" strokeLinecap="round"/>
          </svg>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#dfff00] border border-[#f7f8fa]" />
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-[#e5e7eb] mx-1" />

        {/* User pill */}
        <div className="flex items-center gap-2.5 bg-white rounded-full pl-3 pr-1.5 py-1.5 shadow-sm">
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
