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
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed-dim)]"
          title="Buscar"
        >
          <Search size={17} strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed-dim)]"
          title="Notificaciones"
        >
          <Bell size={17} strokeWidth={1.8} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent-neon)]" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-7 w-px bg-[var(--color-surface-container-high)]" />

        {/* User pill */}
        <div className="flex items-center gap-2.5 rounded-full bg-[var(--color-surface-container-lowest)] py-1.5 pl-3 pr-1.5">
          <span className="text-[13px] font-semibold text-[var(--color-on-surface)]">{name}</span>
          <span className="rounded-full bg-[var(--color-primary-fixed-dim)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface)]">
            {isAdmin ? 'Admin' : 'Editor'}
          </span>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-neon)] text-[11px] font-bold text-[var(--color-on-surface)]">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
