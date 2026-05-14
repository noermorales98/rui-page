# CRM Visual Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar visualmente el CRM completo con estética SaaS premium usando componentes UI compartidos, Hugeicons, navbar superior y tablas convertidas a filas-card — sin tocar lógica, rutas ni datos.

**Architecture:** Enfoque B — librería de componentes UI compartidos en `app/crm/_components/ui/`. El layout CRM pasa de `flex` con sidebar fija a un CSS Grid con 2 columnas y 2 filas. Se crean componentes Navbar y SidebarNav (client) nuevos. Todos los archivos de page y tabla se actualizan para usar los nuevos componentes.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, `@hugeicons/react` + `@hugeicons/core-free-icons` (ya instalados), Inter (ya cargada).

---

## Archivos a crear

| Archivo | Responsabilidad |
|---|---|
| `app/crm/_components/ui/Card.tsx` | Wrapper de card con estilos base |
| `app/crm/_components/ui/Button.tsx` | Botón con variantes primary/secondary/accent |
| `app/crm/_components/ui/Badge.tsx` | Badge con variantes de color |
| `app/crm/_components/ui/Input.tsx` | Input redondeado con focus lime |
| `app/crm/_components/ui/IconCircle.tsx` | Círculo blanco para iconos |
| `app/crm/_components/ui/MetricCard.tsx` | Card de métrica con icono + valor + label |
| `app/crm/_components/ui/StatusBadge.tsx` | Badge mapeado desde status Prisma |
| `app/crm/_components/ui/ModalWrapper.tsx` | Overlay + panel para modales |
| `app/crm/_components/ui/index.ts` | Re-exports de todos los UI components |
| `app/crm/_components/Navbar.tsx` | Navbar server: título + notif + búsqueda + usuario |
| `app/crm/_components/NavbarTitle.tsx` | Client component: título de página según pathname |
| `app/crm/_components/SidebarNav.tsx` | Client component: nav items con estado activo |

## Archivos a modificar

`app/crm/layout.tsx` · `app/crm/_components/Sidebar.tsx` · `app/crm/_components/SignOutButton.tsx` · `app/crm/dashboard/page.tsx` · `app/crm/cursos/page.tsx` · `app/crm/configuracion/page.tsx` · `app/crm/configuracion/usuarios/page.tsx` · `app/crm/contactos/page.tsx` · `app/crm/contactos/nuevo/page.tsx` · `app/crm/contactos/importar/page.tsx` · `app/crm/contactos/[id]/editar/page.tsx` · `app/crm/contactos/_components/ContactsTable.tsx` · `app/crm/contactos/_components/ContactFilters.tsx` · `app/crm/contactos/_components/ContactForm.tsx` · `app/crm/contactos/_components/CsvImporter.tsx` · `app/crm/_lib/ui-tokens.ts` · `app/crm/contactos/[id]/page.tsx` · `app/crm/contactos/[id]/_components/ContactHeader.tsx` · `app/crm/contactos/[id]/_components/ActivityFeed.tsx` · `app/crm/contactos/[id]/_components/ActivityTimeline.tsx` · `app/crm/contactos/[id]/_components/AddNoteForm.tsx` · `app/crm/contactos/[id]/_components/ContactDeals.tsx` · `app/crm/contactos/[id]/_components/EditDeleteButtons.tsx` · `app/crm/pipeline/page.tsx` · `app/crm/pipeline/_components/PipelineColumn.tsx` · `app/crm/pipeline/_components/DealCard.tsx` · `app/crm/pipeline/_components/PipelineBoard.tsx` · `app/crm/pipeline/_components/CreateDealModal.tsx` · `app/crm/ventas/page.tsx` · `app/crm/ventas/_components/SalesTable.tsx` · `app/crm/ventas/_components/SalesFilters.tsx` · `app/crm/ventas/_components/CreateSaleModal.tsx` · `app/crm/webinars/page.tsx` · `app/crm/webinars/_components/WebinarTable.tsx` · `app/crm/webinars/_components/CreateWebinarModal.tsx` · `app/crm/webinars/[id]/page.tsx` · `app/crm/webinars/[id]/_components/WebinarHeader.tsx` · `app/crm/webinars/[id]/_components/WebinarStats.tsx` · `app/crm/webinars/[id]/_components/ParticipantsTable.tsx` · `app/crm/formularios/page.tsx` · `app/crm/formularios/_components/FormulariosTable.tsx` · `app/crm/formularios/_components/CreateFormModal.tsx` · `app/crm/formularios/[id]/page.tsx` · `app/crm/formularios/[id]/respuestas/page.tsx` · `app/crm/campanas/page.tsx` · `app/crm/campanas/_components/CampaignsTable.tsx` · `app/crm/campanas/new/page.tsx` · `app/crm-login/page.tsx` · `.gitignore`

---

## Task 1: Librería de componentes UI compartidos

**Files:**
- Create: `app/crm/_components/ui/Card.tsx`
- Create: `app/crm/_components/ui/Button.tsx`
- Create: `app/crm/_components/ui/Badge.tsx`
- Create: `app/crm/_components/ui/Input.tsx`
- Create: `app/crm/_components/ui/IconCircle.tsx`
- Create: `app/crm/_components/ui/MetricCard.tsx`
- Create: `app/crm/_components/ui/StatusBadge.tsx`
- Create: `app/crm/_components/ui/ModalWrapper.tsx`
- Create: `app/crm/_components/ui/index.ts`

- [ ] **Step 1: Crear `Card.tsx`**

```tsx
// app/crm/_components/ui/Card.tsx
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className = '', accent = false }: CardProps) {
  const base = accent
    ? 'bg-[#dfff00] rounded-[28px] p-6'
    : 'bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6'
  return <div className={`${base} ${className}`}>{children}</div>
}
```

- [ ] **Step 2: Crear `Button.tsx`**

```tsx
// app/crm/_components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'accent'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#080808] text-white hover:bg-[#222]',
  secondary: 'bg-white text-[#080808] hover:bg-[#f2f2f2] shadow-sm',
  accent: 'bg-[#dfff00] text-[#080808] hover:brightness-95',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition cursor-pointer border-none font-sans disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 3: Crear `Badge.tsx`**

```tsx
// app/crm/_components/ui/Badge.tsx
import type { ReactNode } from 'react'

type Variant = 'lime' | 'blue' | 'gray' | 'amber' | 'red'

const VARIANTS: Record<Variant, string> = {
  lime:  'bg-[#dfff00] text-[#080808]',
  blue:  'bg-[#9bbdf7] text-[#080808]',
  gray:  'bg-[#f0f1f3] text-[#8a8a8a]',
  amber: 'bg-amber-50 text-amber-700',
  red:   'bg-red-50 text-red-600',
}

interface BadgeProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Crear `Input.tsx`**

```tsx
// app/crm/_components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-white rounded-full px-5 py-2.5 text-sm text-[#080808] outline-none border-2 border-transparent focus:border-[#dfff00] transition placeholder:text-[#aaa] ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'
```

- [ ] **Step 5: Crear `IconCircle.tsx`**

```tsx
// app/crm/_components/ui/IconCircle.tsx
import type { ReactNode } from 'react'

interface IconCircleProps {
  children: ReactNode
  className?: string
}

export function IconCircle({ children, className = '' }: IconCircleProps) {
  return (
    <div className={`w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Crear `MetricCard.tsx`**

```tsx
// app/crm/_components/ui/MetricCard.tsx
import type { ReactNode } from 'react'
import { Card } from './Card'
import { IconCircle } from './IconCircle'

interface MetricCardProps {
  icon: ReactNode
  value: string | number
  label: string
  accent?: boolean
}

export function MetricCard({ icon, value, label, accent = false }: MetricCardProps) {
  return (
    <Card accent={accent} className="flex flex-col">
      <IconCircle className="mb-4">{icon}</IconCircle>
      <p className="text-3xl font-bold tracking-[-0.04em] text-[#080808]">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-[#8a8a8a]">{label}</p>
    </Card>
  )
}
```

- [ ] **Step 7: Crear `StatusBadge.tsx`**

```tsx
// app/crm/_components/ui/StatusBadge.tsx
import { Badge } from './Badge'
import type { BadgeProps } from './Badge'

// Contact status
const CONTACT_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' }> = {
  NEW:       { label: 'Nuevo',      variant: 'lime' },
  QUALIFIED: { label: 'Calificado', variant: 'blue' },
  CLIENT:    { label: 'Cliente',    variant: 'gray' },
}

// Sale status
const SALE_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' | 'amber' | 'red' }> = {
  PAID:      { label: 'Pagada',       variant: 'lime'  },
  PENDING:   { label: 'Pendiente',    variant: 'amber' },
  REFUNDED:  { label: 'Reembolsada',  variant: 'amber' },
  CANCELED:  { label: 'Cancelada',    variant: 'gray'  },
}

// Pipeline stage
const DEAL_STAGE: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' | 'amber' }> = {
  LEAD:        { label: 'Lead',          variant: 'gray'  },
  DEMO:        { label: 'Demo',          variant: 'blue'  },
  NEGOTIATION: { label: 'Negociación',   variant: 'amber' },
  ENROLLED:    { label: 'Inscrito',      variant: 'lime'  },
}

// Campaign status
const CAMPAIGN_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' | 'amber' | 'red' }> = {
  DRAFT:    { label: 'Borrador',  variant: 'gray'  },
  SENDING:  { label: 'Enviando', variant: 'blue'  },
  SENT:     { label: 'Enviada',  variant: 'lime'  },
  PARTIAL:  { label: 'Parcial',  variant: 'amber' },
  FAILED:   { label: 'Fallida',  variant: 'red'   },
  ARCHIVED: { label: 'Archivada',variant: 'gray'  },
}

// Form status
const FORM_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' }> = {
  DRAFT:     { label: 'Borrador',   variant: 'gray' },
  PUBLISHED: { label: 'Publicado',  variant: 'lime' },
  ARCHIVED:  { label: 'Archivado',  variant: 'gray' },
}

function fallback(status: string) {
  return { label: status, variant: 'gray' as const }
}

export function ContactStatusBadge({ status }: { status: string }) {
  const { label, variant } = CONTACT_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}

export function SaleStatusBadge({ status }: { status: string }) {
  const { label, variant } = SALE_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}

export function DealStageBadge({ stage }: { stage: string }) {
  const { label, variant } = DEAL_STAGE[stage] ?? fallback(stage)
  return <Badge variant={variant}>{label}</Badge>
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const { label, variant } = CAMPAIGN_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}

export function FormStatusBadge({ status }: { status: string }) {
  const { label, variant } = FORM_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}
```

- [ ] **Step 8: Crear `ModalWrapper.tsx`**

```tsx
// app/crm/_components/ui/ModalWrapper.tsx
'use client'

import type { ReactNode } from 'react'

interface ModalWrapperProps {
  onClose: () => void
  children: ReactNode
  title: string
}

export function ModalWrapper({ onClose, children, title }: ModalWrapperProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[28px] shadow-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#8a8a8a] hover:bg-[#e5e7eb] transition border-none cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Crear `index.ts`**

```ts
// app/crm/_components/ui/index.ts
export { Card } from './Card'
export { Button } from './Button'
export { Badge } from './Badge'
export { Input } from './Input'
export { IconCircle } from './IconCircle'
export { MetricCard } from './MetricCard'
export {
  ContactStatusBadge,
  SaleStatusBadge,
  DealStageBadge,
  CampaignStatusBadge,
  FormStatusBadge,
} from './StatusBadge'
export { ModalWrapper } from './ModalWrapper'
```

- [ ] **Step 10: Commit**

```bash
git add app/crm/_components/ui/
git commit -m "feat(crm-ui): add shared UI component library (Card, Button, Badge, Input, MetricCard, StatusBadge, ModalWrapper)"
```

---

## Task 2: Layout CRM + Navbar

**Files:**
- Modify: `app/crm/layout.tsx`
- Create: `app/crm/_components/Navbar.tsx`
- Create: `app/crm/_components/NavbarTitle.tsx`

- [ ] **Step 1: Crear `NavbarTitle.tsx` (Client Component)**

```tsx
// app/crm/_components/NavbarTitle.tsx
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
  // exact match first
  if (TITLES[pathname]) return TITLES[pathname]
  // prefix match for dynamic routes (e.g. /crm/contactos/123)
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
```

- [ ] **Step 2: Crear `Navbar.tsx` (Server Component)**

```tsx
// app/crm/_components/Navbar.tsx
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
```

- [ ] **Step 3: Actualizar `app/crm/layout.tsx`**

```tsx
// app/crm/layout.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from './_components/Sidebar'
import Navbar from './_components/Navbar'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/crm-login')

  return (
    <div className="min-h-screen bg-[#edeef0] p-5">
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: '260px 1fr',
          gridTemplateRows: '68px 1fr',
          minHeight: 'calc(100vh - 40px)',
        }}
      >
        {/* Sidebar spans both rows */}
        <div style={{ gridColumn: '1', gridRow: '1 / 3' }}>
          <Sidebar />
        </div>

        {/* Navbar: col 2, row 1 */}
        <div style={{ gridColumn: '2', gridRow: '1' }}>
          <Navbar />
        </div>

        {/* Main content: col 2, row 2 */}
        <main style={{ gridColumn: '2', gridRow: '2' }} className="min-w-0">
          <div className="flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar en navegador**

```bash
npm run dev
```

Abrir `http://localhost:3000/crm/dashboard`. Verificar: sidebar a la izquierda ocupa toda la altura, navbar en la parte superior derecha con usuario visible, fondo gris claro.

- [ ] **Step 5: Commit**

```bash
git add app/crm/layout.tsx app/crm/_components/Navbar.tsx app/crm/_components/NavbarTitle.tsx
git commit -m "feat(crm-ui): add Navbar with user/search/notif + grid layout"
```

---

## Task 3: Sidebar con Hugeicons y estado activo

**Files:**
- Create: `app/crm/_components/SidebarNav.tsx`
- Modify: `app/crm/_components/Sidebar.tsx`
- Modify: `app/crm/_components/SignOutButton.tsx`

- [ ] **Step 1: Crear `SidebarNav.tsx` (Client Component)**

```tsx
// app/crm/_components/SidebarNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/crm/dashboard',              icon: DashboardSquare01Icon },
  { label: 'Contactos',    href: '/crm/contactos',              icon: UserMultipleIcon      },
  { label: 'Pipeline',     href: '/crm/pipeline',               icon: GitBranchIcon         },
  { label: 'Webinars',     href: '/crm/webinars',               icon: Video01Icon           },
  { label: 'Formularios',  href: '/crm/formularios',            icon: File01Icon            },
  { label: 'Campañas',     href: '/crm/campanas',               icon: Mail01Icon            },
  { label: 'Cursos',       href: '/crm/cursos',                 icon: BookOpen01Icon        },
  { label: 'Ventas',       href: '/crm/ventas',                 icon: ShoppingCart01Icon    },
]

const CONFIG_ITEMS = [
  { label: 'Configuración', href: '/crm/configuracion',          icon: Settings01Icon        },
  { label: 'Usuarios',      href: '/crm/configuracion/usuarios', icon: UserAccountIcon, adminOnly: true },
]

interface SidebarNavProps {
  isAdmin: boolean
}

export function SidebarNav({ isAdmin }: SidebarNavProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/crm/contactos') return pathname === href || (pathname.startsWith('/crm/contactos/') && !pathname.startsWith('/crm/contactos/['))
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
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-[13.5px] font-medium transition-colors ${
              active
                ? 'bg-white text-[#080808] font-semibold shadow-sm'
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

      {CONFIG_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(({ label, href, icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-[13.5px] font-medium transition-colors ${
              active
                ? 'bg-white text-[#080808] font-semibold shadow-sm'
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
```

- [ ] **Step 2: Actualizar `Sidebar.tsx`**

```tsx
// app/crm/_components/Sidebar.tsx
import { auth } from '@/auth'
import SignOutButton from './SignOutButton'
import { SidebarNav } from './SidebarNav'

export default async function Sidebar() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <aside className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-5 flex flex-col gap-2 h-full">
      {/* Brand */}
      <div className="px-2 pb-4 border-b border-[#e5e7eb] mb-2">
        <span className="text-[17px] font-bold tracking-[-0.04em] text-[#080808]">Rui CRM</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav isAdmin={isAdmin} />
      </div>

      {/* Sign out */}
      <div className="pt-3 border-t border-[#e5e7eb]">
        <SignOutButton />
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Actualizar `SignOutButton.tsx`**

```tsx
// app/crm/_components/SignOutButton.tsx
'use client'

import { signOut } from 'next-auth/react'
import { HugeiconsIcon } from '@hugeicons/react'
import Logout01Icon from '@hugeicons/core-free-icons/Logout01Icon'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/crm-login' })}
      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-full text-[13.5px] font-medium text-[#8a8a8a] hover:bg-white hover:text-[#080808] transition-colors border-none bg-transparent cursor-pointer font-sans"
    >
      <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.5} className="opacity-60" />
      Cerrar sesión
    </button>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/crm/_components/Sidebar.tsx app/crm/_components/SidebarNav.tsx app/crm/_components/SignOutButton.tsx
git commit -m "feat(crm-ui): redesign Sidebar with Hugeicons and active route detection"
```

---

## Task 4: Páginas stub (Dashboard, Cursos, Configuración)

**Files:**
- Modify: `app/crm/dashboard/page.tsx`
- Modify: `app/crm/cursos/page.tsx`
- Modify: `app/crm/configuracion/page.tsx`
- Modify: `app/crm/configuracion/usuarios/page.tsx`

- [ ] **Step 1: Actualizar `dashboard/page.tsx`**

```tsx
// Implementación: `app/crm/dashboard/page.tsx` — h1 + subtítulo + card “Módulo en construcción” (mismas clases que el plan / `TOK` si ya migrado).
// Ver archivo en el repo.
```

- [ ] **Step 2: Actualizar `cursos/page.tsx`**

```tsx
// Implementación: `app/crm/cursos/page.tsx` — mismo layout stub que dashboard (título Cursos + card).
// Ver archivo en el repo.
```

- [ ] **Step 3: Actualizar `configuracion/page.tsx`**

```tsx
// Implementación: `app/crm/configuracion/page.tsx` — mismo patrón stub (título Configuración + card).
// Ver archivo en el repo.
```

- [ ] **Step 4: Actualizar `configuracion/usuarios/page.tsx`** — leer el archivo; solo tipografía (`h1`/`p`) y envolver tabla en card (`bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6` o `<Card>`); no tocar la lógica de la tabla.

```tsx
// Implementación: `app/crm/configuracion/usuarios/page.tsx`.
// Ver archivo en el repo.
```

- [ ] **Step 5: Commit**

```bash
git add app/crm/dashboard/page.tsx app/crm/cursos/page.tsx app/crm/configuracion/
git commit -m "feat(crm-ui): update stub pages with new typography and card wrapper"
```

---

## Task 5: Módulo Contactos (lista)

> **Nota:** El listado ya no usa modales para import ni alta: `Link` a `/crm/contactos/importar` y `/crm/contactos/nuevo`. Snippets antiguos con `ImportCsvModal` / `CreateContactModal` están en [`docs/superpowers/archive/2026-05-06-crm-contacts-modales-apendices-historico.md`](../archive/2026-05-06-crm-contacts-modales-apendices-historico.md) (apéndice Task 3). Índice de archivos: [`docs/superpowers/archive/README.md`](../archive/README.md).

**Files:**
- Modify: `app/crm/contactos/page.tsx`
- Modify: `app/crm/contactos/_components/ContactsTable.tsx`
- Modify: `app/crm/contactos/_components/ContactFilters.tsx`

- [ ] **Step 1: Actualizar `contactos/page.tsx`**

```tsx
// Snippet con modales: histórico. Patrón actual en `app/crm/contactos/page.tsx` (Link importar/nuevo, servicios, TOK).
// Archivado: `docs/superpowers/archive/2026-05-06-crm-contacts-modales-apendices-historico.md` (apéndice Task 3).
```


- [ ] **Step 2: Actualizar `ContactsTable.tsx` — tabla a filas-card**

```tsx
// Implementación: `app/crm/contactos/_components/ContactsTable.tsx` (filas-card, `TOK`, tema).
// El plan ya no duplica el listado completo.
```


- [ ] **Step 3: Actualizar `ContactFilters.tsx`**

```tsx
// Implementación: `app/crm/contactos/_components/ContactFilters.tsx` (URL params, inputs al tema).
// Ver archivo en el repo.
```


- [ ] **Step 4: Commit**

```bash
git add app/crm/contactos/page.tsx app/crm/contactos/_components/ContactsTable.tsx app/crm/contactos/_components/ContactFilters.tsx
git commit -m "feat(crm-ui): redesign Contactos list with card-rows and new filters"
```

---

## Task 6: Detalle de contacto

**Files:**
- Modify: `app/crm/contactos/[id]/page.tsx`
- Modify: `app/crm/contactos/[id]/_components/ContactHeader.tsx`
- Modify: `app/crm/contactos/[id]/_components/ActivityFeed.tsx`
- Modify: `app/crm/contactos/[id]/_components/AddNoteForm.tsx`

- [ ] **Step 1: Actualizar `contactos/[id]/page.tsx`**

```tsx
// Implementación: `app/crm/contactos/[id]/page.tsx` — `getContact`, `ActivityTimeline`, paneles `TOK`.
// Edición: `/crm/contactos/[id]/editar`.
```


- [ ] **Step 2: Actualizar `ContactHeader.tsx`**

```tsx
// Implementación: `app/crm/contactos/[id]/_components/ContactHeader.tsx`.
// `EditDeleteButtons` usa `Link` a editar.
```


- [ ] **Step 3: Actualizar `AddNoteForm.tsx` — solo clases visuales, mantener lógica**

Localizar los elementos de formulario y aplicar:
- `<textarea>`: cambiar a `className="w-full bg-white rounded-2xl px-4 py-3 text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition resize-none placeholder:text-[#aaa]"`
- Botón submit: `className="bg-[#080808] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#222] transition border-none cursor-pointer font-sans"`

- [ ] **Step 4: Actualizar `ActivityFeed.tsx` — solo clases visuales**

Localizar cada item de actividad y cambiar:
- Contenedor de cada nota: `className="bg-white rounded-2xl px-4 py-3 mb-2 last:mb-0"`
- Texto de nota: `className="text-sm text-[#080808]"`
- Meta (autor, fecha): `className="mt-1 text-xs text-[#8a8a8a]"`

- [ ] **Step 5: Commit**

```bash
git add "app/crm/contactos/[id]/"
git commit -m "feat(crm-ui): redesign contact detail page and sub-components"
```

---

## Task 7: Pipeline

**Files:**
- Modify: `app/crm/pipeline/page.tsx`
- Modify: `app/crm/pipeline/_components/PipelineColumn.tsx`
- Modify: `app/crm/pipeline/_components/DealCard.tsx`
- Modify: `app/crm/pipeline/_components/PipelineBoard.tsx`

- [ ] **Step 1: Actualizar `pipeline/page.tsx`**

```tsx
// Implementación: `app/crm/pipeline/page.tsx`.
// Ver archivo en el repo.
```


- [ ] **Step 2: Actualizar `PipelineColumn.tsx`**

```tsx
// Implementación: `app/crm/pipeline/_components/PipelineColumn.tsx` (tema, colores por etapa).
// Ver archivo en el repo.
```


- [ ] **Step 3: Actualizar `DealCard.tsx`**

```tsx
// Implementación: `app/crm/pipeline/_components/DealCard.tsx`.
// Ver archivo en el repo.
```


- [ ] **Step 4: Actualizar `PipelineBoard.tsx` — solo el DragOverlay**

En `PipelineBoard.tsx`, cambiar el div del DragOverlay:
```tsx
// Antes:
<div className="w-72 cursor-grabbing rounded-lg bg-white px-4 py-3 shadow-xl ring-1 ring-indigo-300 opacity-90">

// Después:
<div className="w-64 cursor-grabbing rounded-2xl bg-white px-3.5 py-3 shadow-xl ring-2 ring-[#9bbdf7] opacity-90">
```

- [ ] **Step 5: Commit**

```bash
git add app/crm/pipeline/
git commit -m "feat(crm-ui): redesign Pipeline kanban with new column and card styles"
```

---

## Task 8: Módulo Ventas

**Files:**
- Modify: `app/crm/ventas/page.tsx`
- Modify: `app/crm/ventas/_components/SalesTable.tsx`
- Modify: `app/crm/ventas/_components/SalesFilters.tsx`

- [ ] **Step 1: Actualizar `ventas/page.tsx`**

```tsx
// Implementación: `app/crm/ventas/page.tsx` — métricas, `TOK.panel`, `TOK.pagerLink`.
// Ver archivo en el repo.
```


- [ ] **Step 2: Actualizar `SalesTable.tsx` — tabla a filas-card**

```tsx
// Implementación: `app/crm/ventas/_components/SalesTable.tsx`.
// Ver archivo en el repo.
```


- [ ] **Step 3: Actualizar `SalesFilters.tsx` — mismas clases que ContactFilters**

Aplicar el mismo patrón de `ContactFilters`: inputs con `rounded-full border-2 border-transparent focus:border-[#dfff00]`, selects con `bg-white rounded-full px-4 py-2.5 border-none shadow-sm`.

- [ ] **Step 4: Commit**

```bash
git add app/crm/ventas/
git commit -m "feat(crm-ui): redesign Ventas with MetricCards and card-row table"
```

---

## Task 9: Módulo Webinars

**Files:**
- Modify: `app/crm/webinars/page.tsx`
- Modify: `app/crm/webinars/_components/WebinarTable.tsx`
- Modify: `app/crm/webinars/[id]/page.tsx`
- Modify: `app/crm/webinars/[id]/_components/WebinarStats.tsx`
- Modify: `app/crm/webinars/[id]/_components/ParticipantsTable.tsx`

- [ ] **Step 1: Actualizar `webinars/page.tsx`**

```tsx
// Implementación: `app/crm/webinars/page.tsx`.
// Ver archivo en el repo.
```


- [ ] **Step 2: Actualizar `WebinarTable.tsx` — tabla a filas-card + botón nuevo webinar**

```tsx
// Implementación: `app/crm/webinars/_components/WebinarTable.tsx` (`TOK`, `Button`).
// Ver archivo en el repo.
```


- [ ] **Step 3: Actualizar `webinars/[id]/page.tsx`** — cambiar `rounded-xl bg-white shadow-sm ring-1 ring-gray-200` por `bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)]`. Cambiar el back link al mismo estilo que en contactos.

- [ ] **Step 4: Actualizar `WebinarStats.tsx`** — los 3 stat boxes actuales (`rounded-lg border bg-white`) pasan a `bg-[#f7f8fa] rounded-[24px] border border-white/60 p-5`.

- [ ] **Step 5: Actualizar `ParticipantsTable.tsx`** — tabla a filas-card (mismo patrón que ContactsTable).

- [ ] **Step 6: Commit**

```bash
git add app/crm/webinars/
git commit -m "feat(crm-ui): redesign Webinars list and detail pages"
```

---

## Task 10: Módulo Formularios

**Files:**
- Modify: `app/crm/formularios/page.tsx`
- Modify: `app/crm/formularios/_components/FormulariosTable.tsx`
- Modify: `app/crm/formularios/[id]/page.tsx`
- Modify: `app/crm/formularios/[id]/respuestas/page.tsx`

- [ ] **Step 1: Actualizar `formularios/page.tsx`** — mismo patrón que Contactos:
  - `<h1>` a `text-4xl font-semibold tracking-[-0.04em] text-[#080808]`
  - botón crear con clases `Button primary`
  - tabla envuelta en card `bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[...] p-6`

```tsx
// Implementación: `app/crm/formularios/page.tsx` (h1, crear con `Button`, lista en card / `TOK`).
// Ver archivo en el repo.
```

- [ ] **Step 2: Actualizar `FormulariosTable.tsx` — tabla a filas-card**

Aplicar el mismo patrón de grid card-rows. Cada fila usa:
```
grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0
```
Columnas: `Nombre · Slug · Estado · Campos · Respuestas · Actualizado · Acciones`

Para los botones de acción (archive, clipboard, edit, external-link) mantener su lógica pero aplicar:
```
rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors border-none bg-transparent cursor-pointer
```

Reemplazar `STATUS_CLASSES` por `<FormStatusBadge status={form.status} />` del componente compartido.

```tsx
// Implementación: `app/crm/formularios/_components/FormulariosTable.tsx` (card-rows, `FormStatusBadge`, acciones al tema).
// Ver archivo en el repo.
```

- [ ] **Step 3: Actualizar `formularios/[id]/page.tsx`** — FormBuilder. Cambiar el wrapper exterior a `bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)]`.

```tsx
// Implementación: `app/crm/formularios/[id]/page.tsx` (FormBuilder, wrapper card).
// Ver archivo en el repo.
```

- [ ] **Step 4: Actualizar `formularios/[id]/respuestas/page.tsx`** — misma card wrapper + h1 actualizado.

```tsx
// Implementación: `app/crm/formularios/[id]/respuestas/page.tsx`.
// Ver archivo en el repo.
```

- [ ] **Step 5: Commit**

```bash
git add app/crm/formularios/
git commit -m "feat(crm-ui): redesign Formularios pages with card-rows"
```

---

## Task 11: Módulo Campañas

**Files:**
- Modify: `app/crm/campanas/page.tsx`
- Modify: `app/crm/campanas/_components/CampaignsTable.tsx`
- Modify: `app/crm/campanas/new/page.tsx`

- [ ] **Step 1: Actualizar `campanas/page.tsx`**

```tsx
// Implementación: `app/crm/campanas/page.tsx` — h1 + copy, aviso SMTP, card `TOK`/equivalente, `CampaignsTable`.
// Ver archivo en el repo.
```

- [ ] **Step 2: Actualizar `CampaignsTable.tsx` — tabla a filas-card**

Aplicar patrón de card-rows. Reemplazar `STATUS_CLASSES` por `<CampaignStatusBadge status={campaign.status} />`. Botones de acción (Send, Archive) mantienen lógica pero usan clases nuevas. El wrapper de error pasa a `rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700`.

- [ ] **Step 3: Actualizar `campanas/new/page.tsx`** — cambiar el contenedor del formulario a `bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-8`, inputs a rounded-full, botones a rounded-full.

- [ ] **Step 4: Commit**

```bash
git add app/crm/campanas/
git commit -m "feat(crm-ui): redesign Campañas pages with card-rows"
```

---

## Task 12: Modales

**Files:** Modales CRM que siguen en overlay (`*Modal.tsx`), p. ej.:
- `app/crm/pipeline/_components/CreateDealModal.tsx`
- `app/crm/ventas/_components/CreateSaleModal.tsx`
- `app/crm/webinars/_components/CreateWebinarModal.tsx`
- `app/crm/formularios/_components/CreateFormModal.tsx`

**Contactos:** el alta, edición e importación **no** usan estos modales; ver rutas `nuevo`, `[id]/editar`, `importar` y componentes `ContactForm` / `CsvImporter`.

El patrón a aplicar en CADA modal restante es idéntico. No necesitas reescribir la lógica, solo el wrapper visual:

- [ ] **Step 1: Patrón de modal a aplicar en cada archivo**

Localizar el overlay y el panel interior; alinear con `ModalWrapper` / tokens del CRM (overlay `bg-black/40 backdrop-blur-sm`, panel `rounded-[28px]`, inputs `Input`, botones `Button`). Referencia en repo:

```tsx
// Patrón: `app/crm/_components/ui/ModalWrapper.tsx` y p. ej. `CreateDealModal.tsx`.
// Solo clases y wrapper; no tocar handlers ni campos del formulario.
```

- [ ] **Step 2: Aplicar patrón a `CreateDealModal.tsx`**
- [ ] **Step 3: Aplicar patrón a `CreateSaleModal.tsx`**
- [ ] **Step 4: Aplicar patrón a `CreateWebinarModal.tsx`**
- [ ] **Step 5: Aplicar patrón a `CreateFormModal.tsx`**

- [ ] **Step 6: Commit**

```bash
git add app/crm/pipeline/_components/CreateDealModal.tsx app/crm/ventas/_components/CreateSaleModal.tsx app/crm/webinars/_components/CreateWebinarModal.tsx app/crm/formularios/_components/CreateFormModal.tsx
git commit -m "feat(crm-ui): redesign CRM modals with new panel styles"
```

---

## Task 13: Login page + .gitignore

**Files:**
- Modify: `app/crm-login/page.tsx`
- Modify: `.gitignore`

- [ ] **Step 1: Actualizar `.gitignore`** — añadir `.superpowers/` si no está ya:

```bash
grep -q '.superpowers' .gitignore || echo '.superpowers/' >> .gitignore
```

- [ ] **Step 2: Actualizar `crm-login/page.tsx`** — leer el archivo y aplicar:
  - Fondo: `min-h-screen bg-[#edeef0] flex items-center justify-center p-5`
  - Card central: `bg-[#f7f8fa] rounded-[32px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-10 w-full max-w-sm`
  - Título: `text-3xl font-semibold tracking-[-0.04em] text-[#080808]`
  - Inputs: `w-full bg-white rounded-full px-5 py-3 text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition placeholder:text-[#aaa]`
  - Botón submit: `w-full bg-[#080808] text-white rounded-full py-3 text-sm font-semibold hover:bg-[#222] transition`
  - Error: `rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700`

- [ ] **Step 3: Commit final**

```bash
git add app/crm-login/page.tsx .gitignore
git commit -m "feat(crm-ui): redesign CRM login page + add .superpowers to .gitignore"
```

---

## Verificación final

- [ ] Ejecutar `npm run dev` y navegar por todas las rutas del CRM
- [ ] Verificar que la sidebar muestra el ítem activo correctamente al navegar
- [ ] Verificar que el navbar muestra el título correcto en cada página
- [ ] Verificar que las tablas de contactos, ventas, webinars y campañas muestran filas-card sin HTML `<table>`
- [ ] Verificar que el Pipeline funciona el drag-and-drop correctamente
- [ ] Verificar que los modales abren, cierran y siguen enviando formularios sin errores
- [ ] Ejecutar `npm run build` para confirmar que no hay errores de TypeScript ni build

```bash
npm run build
```

Resultado esperado: `✓ Compiled successfully`
