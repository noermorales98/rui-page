'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, string> = {
  '/crm/dashboard':              'Dashboard',
  '/crm/contactos':              'Contactos',
  '/crm/pipeline':               'Pipeline',
  '/crm/webinars':               'Webinars',
  '/crm/formularios':            'Formularios',
  '/crm/campanas':               'Campañas',
  '/crm/cursos':                 'Cursos',
  '/crm/ventas':                 'Ventas',
  '/crm/configuracion/usuarios': 'Usuarios',
  '/crm/configuracion':          'Configuración',
}

function getTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]
  const match = Object.keys(TITLES)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key + '/'))
  return match ? TITLES[match] : 'CRM'
}

export function NavbarTitle() {
  const pathname = usePathname()
  return (
    <span className="text-[18px] font-semibold tracking-[-0.04em] text-[#080808]">
      {getTitle(pathname)}
    </span>
  )
}
