'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@prisma/client'
import { HugeiconsIcon } from '@hugeicons/react'
import DashboardSquare01Icon from '@hugeicons/core-free-icons/DashboardSquare01Icon'
import UserMultipleIcon from '@hugeicons/core-free-icons/UserMultipleIcon'
import GitBranchIcon from '@hugeicons/core-free-icons/GitBranchIcon'
import Video01Icon from '@hugeicons/core-free-icons/Video01Icon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon'
import BookOpen01Icon from '@hugeicons/core-free-icons/BookOpen01Icon'
import ShoppingCart01Icon from '@hugeicons/core-free-icons/ShoppingCart01Icon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
import UserAccountIcon from '@hugeicons/core-free-icons/UserAccountIcon'
import TagsIcon from '@hugeicons/core-free-icons/TagsIcon'

type NavItem = {
  label: string
  href: string
  icon: typeof DashboardSquare01Icon
  roles?: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/crm/dashboard',              icon: DashboardSquare01Icon },
  { label: 'Contactos',   href: '/crm/contactos',              icon: UserMultipleIcon      },
  { label: 'Pipeline',    href: '/crm/pipeline',               icon: GitBranchIcon         },
  { label: 'Webinars',    href: '/crm/webinars',               icon: Video01Icon           },
  { label: 'Formularios', href: '/crm/formularios',            icon: File01Icon            },
  { label: 'Campañas',    href: '/crm/campanas',               icon: Mail01Icon            },
  { label: 'Cursos',      href: '/crm/cursos',                 icon: BookOpen01Icon        },
  { label: 'Ventas',      href: '/crm/ventas',                 icon: ShoppingCart01Icon    },
]

const CONFIG_ITEMS: NavItem[] = [
  { label: 'Configuración', href: '/crm/configuracion',           icon: Settings01Icon  },
  { label: 'Usuarios',      href: '/crm/configuracion/usuarios',  icon: UserAccountIcon, roles: ['ADMIN'] },
  { label: 'Etiquetas',     href: '/crm/configuracion/etiquetas', icon: TagsIcon,        roles: ['ADMIN', 'VENDEDOR'] },
]

function isVisible(item: NavItem, role: Role | null): boolean {
  if (!item.roles) return true
  return role !== null && item.roles.includes(role)
}

interface SidebarNavProps {
  role: Role | null
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/crm/contactos') return pathname === href || pathname.startsWith('/crm/contactos/')
    if (href === '/crm/webinars') return pathname === href || pathname.startsWith('/crm/webinars/')
    if (href === '/crm/formularios') return pathname === href || pathname.startsWith('/crm/formularios/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ label, href, icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-10 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-[13.5px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7] ${
              active
                ? 'bg-white text-[#080808] font-semibold'
                : 'text-[#8a8a8a] hover:bg-white hover:text-[#080808]'
            }`}
          >
            <HugeiconsIcon
              icon={icon}
              size={16}
              strokeWidth={1.5}
              className={active ? 'opacity-100' : 'opacity-60'}
            />
            {label}
          </Link>
        )
      })}

      <div className="my-2 h-px bg-[#e5e7eb]" />

      {CONFIG_ITEMS.filter((item) => isVisible(item, role)).map(({ label, href, icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-10 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-[13.5px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7] ${
              active
                ? 'bg-white text-[#080808] font-semibold'
                : 'text-[#8a8a8a] hover:bg-white hover:text-[#080808]'
            }`}
          >
            <HugeiconsIcon
              icon={icon}
              size={16}
              strokeWidth={1.5}
              className={active ? 'opacity-100' : 'opacity-60'}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
