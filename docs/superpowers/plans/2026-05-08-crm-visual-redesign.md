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

`app/crm/layout.tsx` · `app/crm/_components/Sidebar.tsx` · `app/crm/_components/SignOutButton.tsx` · `app/crm/dashboard/page.tsx` · `app/crm/cursos/page.tsx` · `app/crm/configuracion/page.tsx` · `app/crm/configuracion/usuarios/page.tsx` · `app/crm/contactos/page.tsx` · `app/crm/contactos/_components/ContactsTable.tsx` · `app/crm/contactos/_components/ContactFilters.tsx` · `app/crm/contactos/_components/CreateContactModal.tsx` · `app/crm/contactos/_components/ImportCsvModal.tsx` · `app/crm/contactos/[id]/page.tsx` · `app/crm/contactos/[id]/_components/ContactHeader.tsx` · `app/crm/contactos/[id]/_components/ActivityFeed.tsx` · `app/crm/contactos/[id]/_components/AddNoteForm.tsx` · `app/crm/contactos/[id]/_components/ContactDeals.tsx` · `app/crm/contactos/[id]/_components/EditDeleteButtons.tsx` · `app/crm/pipeline/page.tsx` · `app/crm/pipeline/_components/PipelineColumn.tsx` · `app/crm/pipeline/_components/DealCard.tsx` · `app/crm/pipeline/_components/PipelineBoard.tsx` · `app/crm/pipeline/_components/CreateDealModal.tsx` · `app/crm/ventas/page.tsx` · `app/crm/ventas/_components/SalesTable.tsx` · `app/crm/ventas/_components/SalesFilters.tsx` · `app/crm/ventas/_components/CreateSaleModal.tsx` · `app/crm/webinars/page.tsx` · `app/crm/webinars/_components/WebinarTable.tsx` · `app/crm/webinars/_components/CreateWebinarModal.tsx` · `app/crm/webinars/[id]/page.tsx` · `app/crm/webinars/[id]/_components/WebinarHeader.tsx` · `app/crm/webinars/[id]/_components/WebinarStats.tsx` · `app/crm/webinars/[id]/_components/ParticipantsTable.tsx` · `app/crm/formularios/page.tsx` · `app/crm/formularios/_components/FormulariosTable.tsx` · `app/crm/formularios/_components/CreateFormModal.tsx` · `app/crm/formularios/[id]/page.tsx` · `app/crm/formularios/[id]/respuestas/page.tsx` · `app/crm/campanas/page.tsx` · `app/crm/campanas/_components/CampaignsTable.tsx` · `app/crm/campanas/new/page.tsx` · `app/crm-login/page.tsx` · `.gitignore`

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
    <header className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] h-[68px] px-6 flex items-center justify-between">
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
// app/crm/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Dashboard</h1>
        <p className="mt-1.5 text-sm text-[#8a8a8a]">Resumen general del CRM</p>
      </div>
      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-12 text-center">
        <p className="text-[#8a8a8a] text-sm">Módulo en construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `cursos/page.tsx`**

```tsx
// app/crm/cursos/page.tsx
export default function CursosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Cursos</h1>
        <p className="mt-1.5 text-sm text-[#8a8a8a]">Gestión de cursos y programas</p>
      </div>
      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-12 text-center">
        <p className="text-[#8a8a8a] text-sm">Módulo en construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Actualizar `configuracion/page.tsx`**

```tsx
// app/crm/configuracion/page.tsx
export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Configuración</h1>
        <p className="mt-1.5 text-sm text-[#8a8a8a]">Ajustes generales del CRM</p>
      </div>
      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-12 text-center">
        <p className="text-[#8a8a8a] text-sm">Módulo en construcción</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Actualizar `configuracion/usuarios/page.tsx`** — leer el archivo actual primero, luego actualizar solo el `<h1>` y el wrapper añadiendo las clases nuevas (mantener toda la tabla/lógica existente dentro de un `<Card>`).

El patrón a aplicar en este archivo y en todos los demás page files que tengan estructura similar:
```tsx
// Cambiar de:
<h1 className="text-2xl font-bold text-gray-900">Título</h1>
<p className="mt-1 text-sm text-gray-500">Subtítulo</p>

// A:
<h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Título</h1>
<p className="mt-1.5 text-sm text-[#8a8a8a]">Subtítulo</p>

// Y envolver tablas/contenido en:
<div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
  {/* tabla existente */}
</div>
```

- [ ] **Step 5: Commit**

```bash
git add app/crm/dashboard/page.tsx app/crm/cursos/page.tsx app/crm/configuracion/
git commit -m "feat(crm-ui): update stub pages with new typography and card wrapper"
```

---

## Task 5: Módulo Contactos (lista)

**Files:**
- Modify: `app/crm/contactos/page.tsx`
- Modify: `app/crm/contactos/_components/ContactsTable.tsx`
- Modify: `app/crm/contactos/_components/ContactFilters.tsx`

- [ ] **Step 1: Actualizar `contactos/page.tsx`**

```tsx
// app/crm/contactos/page.tsx
import { prisma } from '@/lib/prisma'
import { ContactsTable } from './_components/ContactsTable'
import { ContactFilters } from './_components/ContactFilters'
import { CreateContactModal } from './_components/CreateContactModal'
import { ImportCsvModal } from './_components/ImportCsvModal'

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ q?: string; status?: string; source?: string; tag?: string; page?: string }>
}

export default async function ContactosPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const status = params.status ?? ''
  const source = params.source ?? ''
  const tagId = params.tag ? Number(params.tag) : undefined
  const page = Math.max(1, Number(params.page ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    ...(status ? { status: status as 'NEW' | 'QUALIFIED' | 'CLIENT' } : {}),
    ...(source ? { source: source as 'WEBINAR' | 'FORM' | 'MANUAL' | 'IMPORT' } : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
  }

  const [contacts, total, allTags] = await Promise.all([
    prisma.contact.findMany({
      where, skip, take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.contact.count({ where }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Contactos</h1>
          <p className="mt-1.5 text-sm text-[#8a8a8a]">{total} {total === 1 ? 'contacto' : 'contactos'}</p>
        </div>
        <div className="flex gap-2">
          <ImportCsvModal />
          <CreateContactModal tags={allTags} />
        </div>
      </div>

      {/* Filters */}
      <ContactFilters tags={allTags} />

      {/* Table card */}
      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        <ContactsTable contacts={contacts} />
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[#8a8a8a]">
          <span>Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="bg-white rounded-full px-4 py-2 text-[#080808] text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm">
                Anterior
              </a>
            )}
            {skip + PAGE_SIZE < total && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="bg-white rounded-full px-4 py-2 text-[#080808] text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm">
                Siguiente
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `ContactsTable.tsx` — tabla a filas-card**

```tsx
// app/crm/contactos/_components/ContactsTable.tsx
'use client'

import Link from 'next/link'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { ContactStatusBadge } from '@/app/crm/_components/ui'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar', FORM: 'Formulario', MANUAL: 'Manual', IMPORT: 'Importado',
}

export function ContactsTable({ contacts }: { contacts: ContactWithTags[] }) {
  if (contacts.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#8a8a8a]">
        No hay contactos que coincidan con los filtros.
      </div>
    )
  }

  return (
    <div>
      {/* Column headers */}
      <div className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
        style={{ gridTemplateColumns: '2fr 1.8fr 0.8fr 0.8fr 0.8fr' }}>
        <span>Nombre</span>
        <span>Email</span>
        <span>Estado</span>
        <span>Fuente</span>
        <span>Fecha</span>
      </div>

      {/* Rows */}
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0"
          style={{ gridTemplateColumns: '2fr 1.8fr 0.8fr 0.8fr 0.8fr' }}
        >
          <div>
            <Link
              href={`/crm/contactos/${contact.id}`}
              className="text-sm font-semibold text-[#080808] hover:text-[#5a85cc] transition-colors"
            >
              {contact.name}
            </Link>
            {contact.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {contact.tags.map(({ tag }) => (
                  <span key={tag.id} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-[#8a8a8a] truncate">{contact.email}</span>
          <ContactStatusBadge status={contact.status} />
          <span className="text-xs text-[#8a8a8a]">{SOURCE_LABELS[contact.source] ?? contact.source}</span>
          <span className="text-xs text-[#8a8a8a]">
            {new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(contact.createdAt))}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Actualizar `ContactFilters.tsx`**

```tsx
// app/crm/contactos/_components/ContactFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useEffect } from 'react'
import type { Tag } from '@prisma/client'

interface Props { tags: Tag[] }

const selectClass = 'bg-white rounded-full px-4 py-2.5 text-sm text-[#080808] border-none outline-none focus:ring-2 focus:ring-[#dfff00] cursor-pointer shadow-sm'

export function ContactFilters({ tags }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set(key, value) : params.delete(key)
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParam('q', value), 300)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => handleSearch(e.target.value)}
        className="bg-white rounded-full px-5 py-2.5 text-sm text-[#080808] outline-none border-2 border-transparent focus:border-[#dfff00] transition placeholder:text-[#aaa] shadow-sm w-64"
      />
      <select value={searchParams.get('status') ?? ''} onChange={(e) => updateParam('status', e.target.value)} className={selectClass}>
        <option value="">Estado: Todos</option>
        <option value="NEW">Nuevo</option>
        <option value="QUALIFIED">Calificado</option>
        <option value="CLIENT">Cliente</option>
      </select>
      <select value={searchParams.get('source') ?? ''} onChange={(e) => updateParam('source', e.target.value)} className={selectClass}>
        <option value="">Fuente: Todas</option>
        <option value="WEBINAR">Webinar</option>
        <option value="FORM">Formulario</option>
        <option value="MANUAL">Manual</option>
        <option value="IMPORT">Importado</option>
      </select>
      {tags.length > 0 && (
        <select value={searchParams.get('tag') ?? ''} onChange={(e) => updateParam('tag', e.target.value)} className={selectClass}>
          <option value="">Tag: Todos</option>
          {tags.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>
      )}
    </div>
  )
}
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
// app/crm/contactos/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ContactHeader } from './_components/ContactHeader'
import { ContactInfo } from './_components/ContactInfo'
import { ActivityFeed } from './_components/ActivityFeed'
import { AddNoteForm } from './_components/AddNoteForm'
import { ContactDeals } from './_components/ContactDeals'

interface Props { params: Promise<{ id: string }> }

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params
  const contactId = Number(id)
  if (isNaN(contactId)) notFound()

  const [contact, allTags] = await Promise.all([
    prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        tags: { include: { tag: true } },
        activities: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!contact) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/contactos"
        className="inline-flex items-center gap-1.5 text-sm text-[#8a8a8a] hover:text-[#080808] transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Contactos
      </Link>

      <div className="flex gap-5 items-start">
        {/* Left: info */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] overflow-hidden">
            <ContactInfo contact={contact} />
          </div>
        </div>

        {/* Right: header + activity */}
        <div className="min-w-0 flex-1">
          <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] overflow-hidden">
            <ContactHeader contact={contact} allTags={allTags} />
            <div className="p-6">
              <ContactDeals contactId={contact.id} contactName={contact.name} />
              <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                <h3 className="mb-4 text-sm font-semibold text-[#080808] tracking-[-0.02em]">Actividad</h3>
                <AddNoteForm contactId={contact.id} />
                <ActivityFeed activities={contact.activities} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `ContactHeader.tsx`**

```tsx
// app/crm/contactos/[id]/_components/ContactHeader.tsx
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { EditDeleteButtons } from './EditDeleteButtons'
import { ContactStatusBadge } from '@/app/crm/_components/ui'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

function initials(name: string): string {
  const parts = name.trim().split(' ')
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
}

export function ContactHeader({ contact, allTags }: { contact: ContactWithTags; allTags: Tag[] }) {
  return (
    <div className="flex items-start gap-4 border-b border-[#e5e7eb] p-6">
      <div className="w-12 h-12 rounded-full bg-[#dfff00] flex items-center justify-center text-sm font-bold text-[#080808] flex-shrink-0">
        {initials(contact.name)}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">{contact.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ContactStatusBadge status={contact.status} />
          {contact.tags.map(({ tag }) => (
            <span key={tag.id} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      </div>
      <EditDeleteButtons contact={contact} allTags={allTags} />
    </div>
  )
}
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
// app/crm/pipeline/page.tsx
import { prisma } from '@/lib/prisma'
import { PipelineBoard } from './_components/PipelineBoard'
import type { DealStage } from '@prisma/client'

const STAGES: DealStage[] = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED']

export default async function PipelinePage() {
  const deals = await prisma.deal.findMany({
    include: { contact: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const grouped = Object.fromEntries(
    STAGES.map((s) => [s, deals.filter((d) => d.stage === s)])
  ) as Record<DealStage, typeof deals>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Pipeline</h1>
        <p className="mt-1.5 text-sm text-[#8a8a8a]">{deals.length} oportunidades en total</p>
      </div>
      <PipelineBoard initialDeals={grouped} />
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `PipelineColumn.tsx`**

```tsx
// app/crm/pipeline/_components/PipelineColumn.tsx
'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { DealStage } from '@prisma/client'
import { DealCard } from './DealCard'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'

const STAGE_CONFIG: Record<DealStage, { label: string; labelColor: string; accentBg: boolean }> = {
  LEAD:        { label: 'Lead',          labelColor: 'text-[#8a8a8a]',  accentBg: false },
  DEMO:        { label: 'Demo / Llamada',labelColor: 'text-[#5a85cc]',  accentBg: false },
  NEGOTIATION: { label: 'Negociación',   labelColor: 'text-[#c07a00]',  accentBg: false },
  ENROLLED:    { label: 'Inscrito ✓',    labelColor: 'text-[#5a6a00]',  accentBg: true  },
}

interface Props {
  stage: DealStage
  deals: DealWithContact[]
  onMove: (dealId: number, fromStage: DealStage, toStage: DealStage) => void
  onDelete: (dealId: number, stage: DealStage) => void
}

export function PipelineColumn({ stage, deals, onMove, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = STAGE_CONFIG[stage]

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-[22px] p-3.5 transition-colors flex-shrink-0 w-64 ${
        isOver
          ? 'bg-[#9bbdf7]/15 ring-2 ring-[#9bbdf7]'
          : config.accentBg
            ? 'bg-[#dfff00]/10'
            : 'bg-[#f0f1f3]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className={`text-[11px] font-bold uppercase tracking-[0.06em] ${config.labelColor}`}>
          {config.label}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#080808] ${config.accentBg ? 'bg-[#dfff00]' : 'bg-white'}`}>
          {deals.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-1.5 min-h-16">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onMove={(toStage: DealStage) => onMove(deal.id, stage, toStage)}
            onDelete={() => onDelete(deal.id, stage)}
          />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setModalOpen(true)}
        className={`mt-2 flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed py-2 text-xs text-[#8a8a8a] hover:text-[#080808] transition-colors bg-transparent cursor-pointer font-sans ${config.accentBg ? 'border-[#dfff00]/50 hover:border-[#dfff00]' : 'border-[#d1d5db] hover:border-[#9bbdf7]'}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
        </svg>
        Añadir
      </button>

      {modalOpen && <CreateDealModal initialStage={stage} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
```

- [ ] **Step 3: Actualizar `DealCard.tsx`**

```tsx
// app/crm/pipeline/_components/DealCard.tsx
'use client'

import { useState, startTransition } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { DealStage } from '@prisma/client'
import { deleteDeal } from '../actions'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEMO', label: 'Demo / Llamada' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ENROLLED', label: 'Inscrito' },
]

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

interface Props {
  deal: DealWithContact
  onMove: (toStage: DealStage) => void
  onDelete: () => void
}

export function DealCard({ deal, onMove, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  function handleDelete() {
    if (!window.confirm(`¿Eliminar esta oportunidad de ${deal.contact.name}?`)) return
    onDelete()
    startTransition(async () => { await deleteDeal(deal.id) })
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-2xl px-3.5 py-3 shadow-sm transition-opacity ${
          isDragging ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <a
              href={`/crm/contactos/${deal.contact.id}`}
              className="block truncate text-[13px] font-semibold text-[#080808] hover:text-[#5a85cc] transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {deal.contact.name}
            </a>
            {deal.courseName
              ? <p className="mt-0.5 truncate text-[11px] text-[#8a8a8a]">{deal.courseName}</p>
              : <p className="mt-0.5 text-[11px] italic text-[#bbb]">sin curso</p>
            }
          </div>
          <div className="flex flex-shrink-0 items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={() => setEditOpen(true)}
              className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] hover:text-[#080808] transition-colors border-none bg-transparent cursor-pointer" title="Editar">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z"/>
                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z"/>
              </svg>
            </button>
            <button onClick={handleDelete}
              className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-red-50 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer" title="Eliminar">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2" onPointerDown={(e) => e.stopPropagation()}>
          <select value={deal.stage} onChange={(e) => onMove(e.target.value as DealStage)}
            className="w-full rounded-xl border-0 bg-[#f0f1f3] py-1 px-2 text-xs text-[#8a8a8a] focus:outline-none focus:ring-1 focus:ring-[#dfff00] cursor-pointer">
            {STAGE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <p className="mt-2 text-[10px] text-[#aaa]">{relativeTime(deal.updatedAt)}</p>
      </div>

      {editOpen && <CreateDealModal deal={deal} onClose={() => setEditOpen(false)} />}
    </>
  )
}
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
// app/crm/ventas/page.tsx — mantener toda la lógica, cambiar solo presentación
import { prisma } from '@/lib/prisma'
import { calculateSalesSummary, formatMoneyFromCents } from './_lib/sales-metrics'
import { CreateSaleModal } from './_components/CreateSaleModal'
import { SalesFilters } from './_components/SalesFilters'
import { SalesTable } from './_components/SalesTable'
import { MetricCard } from '@/app/crm/_components/ui'
import type { SaleRow } from './_components/SalesTable'

const PAGE_SIZE = 50
const SALE_STATUSES = ['PENDING', 'PAID', 'REFUNDED', 'CANCELED'] as const
const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CARD', 'STRIPE', 'PAYPAL', 'OTHER'] as const

interface Props {
  searchParams: Promise<{ q?: string; status?: string; method?: string; page?: string }>
}

export default async function VentasPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const status = SALE_STATUSES.find((v) => v === params.status)
  const method = PAYMENT_METHODS.find((v) => v === params.method)
  const page = Math.max(1, Number(params.page ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    ...(q ? { OR: [{ productName: { contains: q } }, { contact: { name: { contains: q } } }, { contact: { email: { contains: q } } }] } : {}),
    ...(status ? { status } : {}),
    ...(method ? { paymentMethod: method } : {}),
  }

  const [sales, total, summaryRows, deals] = await Promise.all([
    prisma.crmSale.findMany({ where, skip, take: PAGE_SIZE, orderBy: { soldAt: 'desc' }, include: { contact: { select: { id: true, name: true, email: true } }, deal: { select: { id: true, courseName: true, stage: true } }, createdBy: { select: { name: true } } } }),
    prisma.crmSale.count({ where }),
    prisma.crmSale.findMany({ where, select: { amountCents: true, status: true, soldAt: true } }),
    prisma.deal.findMany({ where: { stage: { not: 'ENROLLED' } }, orderBy: { updatedAt: 'desc' }, take: 200, include: { contact: { select: { id: true, name: true, email: true } } } }),
  ])

  const summary = calculateSalesSummary(summaryRows)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Ventas</h1>
          <p className="mt-1.5 text-sm text-[#8a8a8a]">Registra ventas, cierra oportunidades y mide ingresos.</p>
        </div>
        <CreateSaleModal deals={deals} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard accent
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"/><path d="M14.71 10.06C14.61 9.3 13.74 8.07 12.16 8.07C10.33 8.07 9.56 9.08 9.41 9.59C9.16 10.26 9.21 11.66 11.35 11.81C14.04 12 15.11 12.32 14.97 13.96C14.84 15.6 13.34 15.95 12.16 15.91C10.98 15.88 9.05 15.33 8.97 13.87M11.97 7V8.07M11.97 15.9V17" strokeLinecap="round"/></svg>}
          value={formatMoneyFromCents(summary.paidRevenueCents)}
          label={`Ingresos pagados · ${summary.paidCount} ventas`}
        />
        <MetricCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h18M3 9h18M3 15h18M3 21h18" strokeLinecap="round"/></svg>}
          value={formatMoneyFromCents(summary.averagePaidTicketCents)}
          label="Ticket promedio"
        />
        <MetricCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          value={formatMoneyFromCents(summary.pendingRevenueCents)}
          label={`Pendiente · ${summary.pendingCount} ventas`}
        />
        <MetricCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 9l3-3 3 3M9 15l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          value={String(summary.refundedCount)}
          label="Reembolsos totales"
        />
      </div>

      <SalesFilters />

      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        <SalesTable sales={sales as SaleRow[]} />
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[#8a8a8a]">
          <span>Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`} className="bg-white rounded-full px-4 py-2 text-[#080808] text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm">Anterior</a>}
            {skip + PAGE_SIZE < total && <a href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`} className="bg-white rounded-full px-4 py-2 text-[#080808] text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm">Siguiente</a>}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `SalesTable.tsx` — tabla a filas-card**

```tsx
// app/crm/ventas/_components/SalesTable.tsx
'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmPaymentMethod, CrmSaleStatus, DealStage } from '@prisma/client'
import { Trash2 } from 'lucide-react'
import { deleteSale, updateSaleStatus } from '../actions'
import { formatMoneyFromCents } from '../_lib/sales-metrics'
import { SaleStatusBadge } from '@/app/crm/_components/ui'

export type SaleRow = {
  id: number; productName: string; amountCents: number; currency: string
  status: CrmSaleStatus; paymentMethod: CrmPaymentMethod; soldAt: Date
  notes: string | null
  contact: { id: number; name: string; email: string }
  deal: { id: number; courseName: string | null; stage: DealStage } | null
  createdBy: { name: string } | null
}

const METHOD_LABELS: Record<CrmPaymentMethod, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia', CARD: 'Tarjeta',
  STRIPE: 'Stripe', PAYPAL: 'PayPal', OTHER: 'Otro',
}

const STATUS_OPTIONS: { value: CrmSaleStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' }, { value: 'PAID', label: 'Pagada' },
  { value: 'REFUNDED', label: 'Reembolsada' }, { value: 'CANCELED', label: 'Cancelada' },
]

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function SalesTable({ sales }: { sales: SaleRow[] }) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(saleId: number, status: CrmSaleStatus) {
    setMessage(null)
    startTransition(async () => { const r = await updateSaleStatus(saleId, status); if (r.error) setMessage(r.error) })
  }

  function handleDelete(sale: SaleRow) {
    if (!window.confirm(`¿Eliminar la venta de "${sale.productName}"?`)) return
    setMessage(null)
    startTransition(async () => { const r = await deleteSale(sale.id); if (r.error) setMessage(r.error) })
  }

  if (sales.length === 0) {
    return <div className="py-12 text-center text-sm text-[#8a8a8a]">No hay ventas que coincidan con los filtros.</div>
  }

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}

      {/* Column headers */}
      <div className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
        style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.5fr' }}>
        <span>Venta</span><span>Contacto</span><span>Monto</span>
        <span>Estado</span><span>Método</span><span></span>
      </div>

      {sales.map((sale) => (
        <div key={sale.id} className="grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0"
          style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.5fr' }}>
          <div>
            <p className="text-sm font-semibold text-[#080808]">{sale.productName}</p>
            <p className="mt-0.5 text-[11px] text-[#8a8a8a]">#{sale.id}{sale.deal && ` · Pipeline #${sale.deal.id}`}</p>
          </div>
          <div>
            <Link href={`/crm/contactos/${sale.contact.id}`}
              className="text-sm font-medium text-[#080808] hover:text-[#5a85cc] transition-colors">
              {sale.contact.name}
            </Link>
            <p className="mt-0.5 text-[11px] text-[#8a8a8a]">{sale.contact.email}</p>
          </div>
          <span className="text-sm font-semibold text-[#080808]">
            {formatMoneyFromCents(sale.amountCents, sale.currency)}
          </span>
          <div>
            <select value={sale.status} disabled={isPending}
              onChange={(e) => handleStatusChange(sale.id, e.target.value as CrmSaleStatus)}
              className="rounded-full border-0 bg-transparent px-0 py-0 text-xs font-semibold focus:outline-none cursor-pointer">
              {STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <span className="text-xs text-[#8a8a8a]">{METHOD_LABELS[sale.paymentMethod]}</span>
          <button type="button" disabled={isPending} onClick={() => handleDelete(sale)}
            className="rounded-xl p-1.5 text-[#8a8a8a] hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors border-none bg-transparent cursor-pointer" aria-label="Eliminar venta">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
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
// app/crm/webinars/page.tsx
import { prisma } from '@/lib/prisma'
import { WebinarTable } from './_components/WebinarTable'
import type { WebinarWithStats } from './_components/WebinarTable'

export default async function WebinarsPage() {
  const webinars = await prisma.webinar.findMany({
    orderBy: { date: 'desc' },
    include: { registrations: { select: { status: true } } },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Webinars</h1>
        <p className="mt-1.5 text-sm text-[#8a8a8a]">Gestión de eventos y participantes</p>
      </div>
      <WebinarTable webinars={webinars as WebinarWithStats[]} />
    </div>
  )
}
```

- [ ] **Step 2: Actualizar `WebinarTable.tsx` — tabla a filas-card + botón nuevo webinar**

```tsx
// app/crm/webinars/_components/WebinarTable.tsx
'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { RegistrationStatus } from '@prisma/client'
import { deleteWebinar } from '../actions'
import { CreateWebinarModal } from './CreateWebinarModal'
import { Badge } from '@/app/crm/_components/ui'

export type WebinarWithStats = {
  id: number; title: string; date: Date | string
  platform: string | null; link: string | null; description: string | null
  registrations: { status: RegistrationStatus }[]
}

function formatDateShort(date: Date | string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function WebinarTable({ webinars }: { webinars: WebinarWithStats[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editWebinar, setEditWebinar] = useState<WebinarWithStats | null>(null)

  function handleDelete(e: React.MouseEvent, w: WebinarWithStats) {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar "${w.title}"? Se perderán todos los registros.`)) return
    startTransition(async () => { const r = await deleteWebinar(w.id); if (r?.error) alert(r.error) })
  }

  return (
    <>
      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-[#8a8a8a]">{webinars.length} webinar{webinars.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setCreateOpen(true)}
            className="bg-[#080808] text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-[#222] transition border-none cursor-pointer font-sans flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Nuevo webinar
          </button>
        </div>

        {webinars.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8a8a8a]">No hay webinars todavía. ¡Crea el primero!</div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
              style={{ gridTemplateColumns: '2fr 1fr 0.6fr 0.6fr 0.6fr 0.4fr' }}>
              <span>Webinar</span><span>Fecha</span>
              <span className="text-center">Reg.</span>
              <span className="text-center">Asist.</span>
              <span className="text-center">Compró</span>
              <span></span>
            </div>

            {webinars.map((w) => (
              <div key={w.id} onClick={() => router.push(`/crm/webinars/${w.id}`)}
                className="grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0 cursor-pointer hover:shadow-sm transition-shadow"
                style={{ gridTemplateColumns: '2fr 1fr 0.6fr 0.6fr 0.6fr 0.4fr' }}>
                <div>
                  <p className="text-sm font-semibold text-[#080808]">{w.title}</p>
                  {w.platform && <p className="mt-0.5 text-[11px] text-[#8a8a8a]">{w.platform}</p>}
                </div>
                <span className="text-xs text-[#8a8a8a]">{formatDateShort(w.date)}</span>
                <span className="text-center text-sm font-bold text-[#5a85cc]">{w.registrations.length}</span>
                <span className="text-center text-sm font-bold text-[#c07a00]">
                  {w.registrations.filter((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED').length}
                </span>
                <span className="text-center text-sm font-bold text-[#5a6a00]">
                  {w.registrations.filter((r) => r.status === 'PURCHASED').length}
                </span>
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); setEditWebinar(w) }}
                    className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors border-none bg-transparent cursor-pointer" aria-label="Editar">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z"/>
                      <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z"/>
                    </svg>
                  </button>
                  <button onClick={(e) => handleDelete(e, w)}
                    className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-red-50 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer" aria-label="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {createOpen && <CreateWebinarModal onClose={() => setCreateOpen(false)} />}
      {editWebinar && <CreateWebinarModal webinar={editWebinar} onClose={() => setEditWebinar(null)} />}
    </>
  )
}
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

- [ ] **Step 3: Actualizar `formularios/[id]/page.tsx`** — FormBuilder. Cambiar el wrapper exterior a `bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)]`.

- [ ] **Step 4: Actualizar `formularios/[id]/respuestas/page.tsx`** — misma card wrapper + h1 actualizado.

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
// app/crm/campanas/page.tsx — cambiar solo la presentación, mantener lógica
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getMissingSmtpConfig } from '@/lib/mailer'
import { CampaignsTable } from './_components/CampaignsTable'
import type { CampaignRow } from './_components/CampaignsTable'

export default async function CampanasPage() {
  const campaigns = await prisma.crmCampaign.findMany({
    where: { status: { not: 'ARCHIVED' } },
    orderBy: { updatedAt: 'desc' }, take: 50,
    select: { id: true, name: true, subject: true, status: true, audienceLabel: true, recipientCount: true, sentCount: true, failedCount: true, sentAt: true, createdAt: true, updatedAt: true, createdBy: { select: { name: true } } },
  })
  const missingSmtpConfig = getMissingSmtpConfig()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Campañas</h1>
          <p className="mt-1.5 text-sm text-[#8a8a8a]">Email marketing segmentado por contactos, leads, webinars y formularios.</p>
        </div>
        <Link href="/crm/campanas/new"
          className="inline-flex items-center gap-2 bg-[#080808] text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-[#222] transition">
          <Plus size={14} /> Crear campaña
        </Link>
      </div>

      {missingSmtpConfig.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configura {missingSmtpConfig.join(', ')} para habilitar el envío real de campañas.
        </div>
      )}

      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        <CampaignsTable campaigns={campaigns as CampaignRow[]} smtpReady={missingSmtpConfig.length === 0} />
      </div>
    </div>
  )
}
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

**Files:** Todos los `*Modal.tsx`
- `app/crm/contactos/_components/CreateContactModal.tsx`
- `app/crm/contactos/_components/ImportCsvModal.tsx`
- `app/crm/pipeline/_components/CreateDealModal.tsx`
- `app/crm/ventas/_components/CreateSaleModal.tsx`
- `app/crm/webinars/_components/CreateWebinarModal.tsx`
- `app/crm/formularios/_components/CreateFormModal.tsx`

El patrón a aplicar en CADA modal es idéntico. No necesitas reescribir la lógica, solo el wrapper visual:

- [ ] **Step 1: Patrón de modal a aplicar en cada archivo**

Localizar el overlay (generalmente `fixed inset-0 z-50 flex items-center justify-center bg-black/50` o similar) y el panel interior. Reemplazar con:

```tsx
{/* Overlay */}
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
  onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
>
  {/* Panel */}
  <div className="bg-white rounded-[28px] shadow-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto">
    {/* Header del modal */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">Título del modal</h2>
      <button onClick={onClose}
        className="w-8 h-8 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#8a8a8a] hover:bg-[#e5e7eb] transition border-none cursor-pointer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
        </svg>
      </button>
    </div>

    {/* Contenido: mantener los form fields exactamente igual, solo actualizar clases */}
    {/* Inputs: className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition placeholder:text-[#aaa]" */}
    {/* Labels: className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5" */}
    {/* Botón submit: className="w-full bg-[#080808] text-white rounded-full py-3 text-sm font-semibold hover:bg-[#222] transition border-none cursor-pointer font-sans" */}
    {/* Botón cancelar: className="w-full bg-[#f0f1f3] text-[#080808] rounded-full py-3 text-sm font-medium hover:bg-[#e5e7eb] transition border-none cursor-pointer font-sans" */}
    {/* Error messages: className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-4" */}
  </div>
</div>
```

- [ ] **Step 2: Aplicar patrón a `CreateContactModal.tsx`**
- [ ] **Step 3: Aplicar patrón a `ImportCsvModal.tsx`**
- [ ] **Step 4: Aplicar patrón a `CreateDealModal.tsx`**
- [ ] **Step 5: Aplicar patrón a `CreateSaleModal.tsx`**
- [ ] **Step 6: Aplicar patrón a `CreateWebinarModal.tsx`**
- [ ] **Step 7: Aplicar patrón a `CreateFormModal.tsx`**

- [ ] **Step 8: Commit**

```bash
git add app/crm/contactos/_components/CreateContactModal.tsx app/crm/contactos/_components/ImportCsvModal.tsx app/crm/pipeline/_components/CreateDealModal.tsx app/crm/ventas/_components/CreateSaleModal.tsx app/crm/webinars/_components/CreateWebinarModal.tsx app/crm/formularios/_components/CreateFormModal.tsx
git commit -m "feat(crm-ui): redesign all CRM modals with new panel styles"
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
