'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Search } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { HugeiconsIcon } from '@hugeicons/react'
import UserAccountIcon from '@hugeicons/core-free-icons/UserAccountIcon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
import Logout01Icon from '@hugeicons/core-free-icons/Logout01Icon'
import { NavbarTitle } from './NavbarTitle'

type Props = {
  name: string
  initials: string
  isAdmin: boolean
  image: string | null
}

const menuItemCls =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary-fixed-dim)]'

function Avatar({ image, initials, size }: { image: string | null; initials: string; size: number }) {
  if (image) {
    return (
      <div
        style={{ width: size, height: size }}
        className="relative flex-shrink-0 overflow-hidden rounded-full"
      >
        <Image src={image} alt="Avatar" fill sizes={`${size}px`} className="object-cover" />
      </div>
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-neon)] font-bold text-[var(--color-on-surface)]"
    >
      {initials}
    </div>
  )
}

export function NavbarClient({ name, initials, isAdmin, image }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

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

        {/* User pill + dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex cursor-pointer items-center gap-2.5 rounded-full border-none bg-[var(--color-surface-container-lowest)] py-1.5 pl-3 pr-1.5 transition hover:bg-[var(--color-surface-container-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed-dim)]"
          >
            <span className="text-[13px] font-semibold text-[var(--color-on-surface)]">{name}</span>
            <span className="rounded-full bg-[var(--color-primary-fixed-dim)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface)]">
              {isAdmin ? 'Admin' : 'Editor'}
            </span>
            <Avatar image={image} initials={initials} size={32} />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] shadow-lg ring-1 ring-[var(--color-surface-container-high)]"
            >
              {/* Header con avatar */}
              <div className="flex items-center gap-3 border-b border-[var(--color-surface-container-high)] px-3 py-3">
                <Avatar image={image} initials={initials} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[var(--color-on-surface)]">{name}</p>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)]">
                    {isAdmin ? 'Administrador' : 'Editor'}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="p-1">
                <Link
                  href="/crm/configuracion/perfil"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemCls}
                >
                  <HugeiconsIcon icon={UserAccountIcon} size={15} strokeWidth={1.5} className="shrink-0 opacity-60" />
                  Mi perfil
                </Link>
                <Link
                  href="/crm/configuracion"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemCls}
                >
                  <HugeiconsIcon icon={Settings01Icon} size={15} strokeWidth={1.5} className="shrink-0 opacity-60" />
                  Configuración
                </Link>
              </div>

              <div className="border-t border-[var(--color-surface-container-high)] p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: '/crm-login' })}
                  className={menuItemCls}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={15} strokeWidth={1.5} className="shrink-0 opacity-60" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
