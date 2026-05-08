'use client'

import { useEffect, useState } from 'react'
import { Bell, Search } from 'lucide-react'
import { NavbarTitle } from './NavbarTitle'

type Props = {
  name: string
  initials: string
  isAdmin: boolean
}

export function NavbarClient({ name, initials, isAdmin }: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const container = document.getElementById('crm-main')
    if (!container) return

    const onScroll = () => setScrolled(container.scrollTop > 10)
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`flex h-[80px] items-center justify-between gap-4 transition-all duration-300 ${
        scrolled ? '' : 'bg-transparent'
      }`}
    >
      {/* Title — se oculta al hacer scroll */}
      <div
        className={`min-w-0 transition-all duration-300 ${
          scrolled
            ? 'pointer-events-none opacity-0 -translate-y-1'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <NavbarTitle />
      </div>

      {/* Acciones — siempre visibles */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
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
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full border border-[#f7f8fa] bg-[#dfff00]" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-7 w-px bg-[#e5e7eb]" />

        {/* User pill */}
        <div className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-3 pr-1.5">
          <span className="text-[13px] font-semibold text-[#080808]">{name}</span>
          <span className="rounded-full bg-[#9bbdf7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#080808]">
            {isAdmin ? 'Admin' : 'Editor'}
          </span>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#dfff00] text-[11px] font-bold text-[#080808]">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
