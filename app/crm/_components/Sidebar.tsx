import Link from 'next/link'
import { auth } from '@/auth'
import SignOutButton from './SignOutButton'
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Video,
  FileText,
  Mail,
  BookOpen,
  ShoppingCart,
  Settings,
  UserCog,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
  { label: 'Contactos', href: '/crm/contactos', icon: Users },
  { label: 'Pipeline', href: '/crm/pipeline', icon: GitBranch },
  { label: 'Webinars', href: '/crm/webinars', icon: Video },
  { label: 'Formularios', href: '/crm/formularios', icon: FileText },
  { label: 'Campañas', href: '/crm/campanas', icon: Mail },
  { label: 'Cursos', href: '/crm/cursos', icon: BookOpen },
  { label: 'Ventas', href: '/crm/ventas', icon: ShoppingCart },
]

export default async function Sidebar() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <aside
      className="fixed inset-y-0 left-0 flex flex-col w-60 z-40"
      style={{ background: '#1a1f2e', borderRight: '1px solid #2d3548' }}
    >
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #2d3548' }}>
        <span className="text-lg font-bold text-white tracking-tight">Rui CRM</span>
      </div>

      {/* User info */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #2d3548' }}>
        <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
        <span
          className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: isAdmin ? '#312e81' : '#1e3a5f',
            color: isAdmin ? '#a5b4fc' : '#7dd3fc',
          }}
        >
          {isAdmin ? 'Admin' : 'Editor'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
            style={{ color: '#94a3b8' }}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}

        {/* Configuración section */}
        <div className="pt-2 mt-2" style={{ borderTop: '1px solid #2d3548' }}>
          <Link
            href="/crm/configuracion"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
            style={{ color: '#94a3b8' }}
          >
            <Settings size={16} />
            <span>Configuración</span>
          </Link>
          {isAdmin && (
            <Link
              href="/crm/configuracion/usuarios"
              className="flex items-center gap-3 rounded-lg px-3 py-2 pl-9 text-sm transition-colors hover:bg-white/5"
              style={{ color: '#64748b' }}
            >
              <UserCog size={14} />
              <span>Usuarios</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid #2d3548' }}>
        <SignOutButton />
      </div>
    </aside>
  )
}
