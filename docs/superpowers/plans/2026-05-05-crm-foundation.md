# CRM Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation layer for the CRM: MariaDB connection via Prisma, multi-user authentication via NextAuth v5, a full CRM shell layout with sidebar, and a user management page where admins can create and deactivate users.

**Architecture:** Prisma connects to the external MariaDB instance with a `User` model (id, name, email, password hash, role, active). NextAuth v5 with CredentialsProvider validates login, stores a JWT session (8h maxAge) with id+role, and the root middleware protects all `/crm/*` routes. The CRM shell is a server component layout with a fixed sidebar and scrollable content area.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Prisma 6 (mysql provider), NextAuth v5 (`next-auth@beta`), bcryptjs, Lucide React, Zod (already installed)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add new dependencies |
| `.env` | Create | DB URL, NextAuth secret, seed password |
| `prisma/schema.prisma` | Create | User model + Role enum |
| `prisma/seed.ts` | Create | Creates initial admin user |
| `lib/prisma.ts` | Create | Prisma client singleton |
| `auth.ts` | Create | NextAuth v5 config (CredentialsProvider, JWT callbacks) |
| `types/next-auth.d.ts` | Create | Extend Session/JWT types with role |
| `middleware.ts` | Create | Protect /crm/* routes, redirect to /crm-login |
| `app/api/auth/[...nextauth]/route.ts` | Create | NextAuth HTTP handlers |
| `app/crm-login/page.tsx` | Create | Login form (client component with useActionState) |
| `app/crm/layout.tsx` | Create | CRM shell: sidebar + content area |
| `app/crm/_components/Sidebar.tsx` | Create | Sidebar with nav links + sign out |
| `app/crm/_components/SignOutButton.tsx` | Create | Client component for sign out button |
| `app/crm/page.tsx` | Create | Redirect to /crm/dashboard |
| `app/crm/dashboard/page.tsx` | Create | Placeholder |
| `app/crm/contactos/page.tsx` | Create | Placeholder |
| `app/crm/pipeline/page.tsx` | Create | Placeholder |
| `app/crm/webinars/page.tsx` | Create | Placeholder |
| `app/crm/formularios/page.tsx` | Create | Placeholder |
| `app/crm/campanas/page.tsx` | Create | Placeholder |
| `app/crm/cursos/page.tsx` | Create | Placeholder |
| `app/crm/ventas/page.tsx` | Create | Placeholder |
| `app/crm/configuracion/page.tsx` | Create | Redirect to /crm/configuracion/usuarios |
| `app/crm/configuracion/usuarios/page.tsx` | Create | Users table (admin only) |
| `app/crm/configuracion/usuarios/_components/CreateUserModal.tsx` | Create | Create user modal (client) |
| `app/crm/configuracion/usuarios/actions.ts` | Create | Server actions: create user, deactivate user |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install all new dependencies**

```bash
cd /Users/noeli/Documents/Develop/rui
npm install prisma @prisma/client next-auth@beta bcryptjs lucide-react
npm install -D @types/bcryptjs
```

Expected output: packages installed without errors.

- [ ] **Step 2: Verify installations**

```bash
ls node_modules | grep -E "^prisma$|^next-auth$|^bcryptjs$|^lucide-react$"
```

Expected:
```
bcryptjs
lucide-react
next-auth
prisma
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install prisma, next-auth, bcryptjs, lucide-react"
```

---

## Task 2: Prisma setup and database schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/prisma.ts`
- Create: `.env`

- [ ] **Step 1: Initialize Prisma**

```bash
cd /Users/noeli/Documents/Develop/rui
npx prisma init --datasource-provider mysql
```

Expected: creates `prisma/schema.prisma` and `.env` with a placeholder `DATABASE_URL`.

- [ ] **Step 2: Set DATABASE_URL in .env**

Open `.env` and replace the contents with:

```bash
DATABASE_URL="mysql://u627288392_ruicrm:Mr@driguez98@82.197.82.158:3306/u627288392_ruicrm"
NEXTAUTH_SECRET="replace-this-with-openssl-rand-base64-32-output"
SEED_ADMIN_PASSWORD="AdminRui2026!"
```

Generate a real secret:
```bash
openssl rand -base64 32
```

Replace `replace-this-with-openssl-rand-base64-32-output` with the output.

- [ ] **Step 3: Write the schema**

Replace the contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(EDITOR)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  EDITOR
}
```

- [ ] **Step 4: Create the Prisma client singleton**

Create `lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Run migration to create the table**

```bash
cd /Users/noeli/Documents/Develop/rui
npx prisma migrate dev --name init
```

Expected output includes: `✔ Generated Prisma Client` and `Your database is now in sync`.

If the remote DB doesn't support `migrate dev`, use `db push` instead:
```bash
npx prisma db push
```

Expected: `✔ Your database is now in sync with your Prisma schema.`

- [ ] **Step 6: Create the seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!password) throw new Error('SEED_ADMIN_PASSWORD env var is required')

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email: 'admin@ruimachalele.com' },
    update: {},
    create: {
      name: 'Rui Machalele',
      email: 'admin@ruimachalele.com',
      password: hashed,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('✔ Admin user created: admin@ruimachalele.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 7: Add seed config to package.json**

In `package.json`, add a `prisma` section alongside `"scripts"`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Install `tsx` to run TypeScript scripts:
```bash
npm install -D tsx
```

- [ ] **Step 8: Run the seed**

```bash
cd /Users/noeli/Documents/Develop/rui
npx prisma db seed
```

Expected: `✔ Admin user created: admin@ruimachalele.com`

- [ ] **Step 9: Add .env to .gitignore**

Verify `.gitignore` contains `.env`:
```bash
grep "^\.env" .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 10: Commit**

```bash
git add prisma/ lib/prisma.ts .gitignore package.json package-lock.json
git commit -m "feat: add Prisma schema, User model, and seed script"
```

---

## Task 3: NextAuth v5 configuration

**Files:**
- Create: `auth.ts`
- Create: `types/next-auth.d.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create the NextAuth type extensions**

Create `types/next-auth.d.ts`:

```ts
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'EDITOR'
    } & DefaultSession['user']
  }

  interface User {
    role: 'ADMIN' | 'EDITOR'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'EDITOR'
  }
}
```

- [ ] **Step 2: Create auth.ts at project root**

Create `auth.ts`:

```ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.active) return null

        const passwordMatch = await bcrypt.compare(parsed.data.password, user.password)
        if (!passwordMatch) return null

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/crm-login',
  },
})
```

- [ ] **Step 3: Create the NextAuth API route handler**

Create `app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | grep -E "auth|next-auth" | head -10
```

Expected: no errors related to auth files.

- [ ] **Step 5: Commit**

```bash
git add auth.ts types/next-auth.d.ts app/api/auth/
git commit -m "feat: configure NextAuth v5 with CredentialsProvider and JWT session"
```

---

## Task 4: Middleware to protect /crm/* routes

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create the middleware**

Create `middleware.ts` at the project root:

```ts
import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isCrmRoute = req.nextUrl.pathname.startsWith('/crm')
  const isLoginPage = req.nextUrl.pathname === '/crm-login'

  if (isCrmRoute && !isLoggedIn) {
    const loginUrl = new URL('/crm-login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/crm/dashboard', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/crm/:path*', '/crm-login'],
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | grep middleware | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware to protect /crm/* routes with NextAuth session check"
```

---

## Task 5: Login page

**Files:**
- Create: `app/crm-login/page.tsx`

- [ ] **Step 1: Create the login page**

Create `app/crm-login/page.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type LoginState = { error?: string } | null

function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  return signIn('credentials', {
    email,
    password,
    redirect: false,
  }).then((result) => {
    if (result?.error) {
      return { error: 'Credenciales incorrectas o cuenta inactiva.' }
    }
    return null
  })
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/crm/dashboard'

  const [state, action, pending] = useActionState(
    async (_: LoginState, formData: FormData) => {
      const result = await loginAction(_, formData)
      if (!result?.error) {
        router.push(callbackUrl)
      }
      return result
    },
    null
  )

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1320' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Rui CRM</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Accede a tu panel de control</p>
        </div>

        <div className="rounded-xl p-8" style={{ background: '#1a1f2e', border: '1px solid #2d3548' }}>
          <form action={action} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2"
                style={{ background: '#0f1320', border: '1px solid #2d3548', focusRingColor: '#4f46e5' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2"
                style={{ background: '#0f1320', border: '1px solid #2d3548' }}
              />
            </div>

            {state?.error && (
              <p role="alert" className="text-sm text-red-400">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#4f46e5' }}
            >
              {pending ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | grep crm-login | head -5
```

Expected: no errors.

- [ ] **Step 3: Test login flow manually**

```bash
cd /Users/noeli/Documents/Develop/rui && npm run dev
```

Open `http://localhost:3000/crm` — should redirect to `/crm-login`.
Login with `admin@ruimachalele.com` / `AdminRui2026!` — should redirect to `/crm/dashboard` (will 404 for now, that's expected).
Login with wrong password — should show error message.

- [ ] **Step 4: Commit**

```bash
git add app/crm-login/
git commit -m "feat: add CRM login page with NextAuth credentials"
```

---

## Task 6: CRM layout and sidebar

**Files:**
- Create: `app/crm/layout.tsx`
- Create: `app/crm/_components/Sidebar.tsx`
- Create: `app/crm/_components/SignOutButton.tsx`
- Create: `app/crm/page.tsx`

- [ ] **Step 1: Create the SignOutButton client component**

Create `app/crm/_components/SignOutButton.tsx`:

```tsx
'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/crm-login' })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
      style={{ color: '#64748b' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#ef4444'
        e.currentTarget.style.background = '#1e1e2e'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#64748b'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <LogOut size={16} />
      <span>Cerrar sesión</span>
    </button>
  )
}
```

- [ ] **Step 2: Create the Sidebar server component**

Create `app/crm/_components/Sidebar.tsx`:

```tsx
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
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: '#94a3b8' }}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}

        {/* Configuración */}
        <div className="pt-2" style={{ borderTop: '1px solid #2d3548', marginTop: '8px' }}>
          <Link
            href="/crm/configuracion"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: '#94a3b8' }}
          >
            <Settings size={16} />
            <span>Configuración</span>
          </Link>
          {isAdmin && (
            <Link
              href="/crm/configuracion/usuarios"
              className="flex items-center gap-3 rounded-lg px-3 py-2 pl-9 text-sm transition-colors"
              style={{ color: '#64748b' }}
            >
              <UserCog size={14} />
              <span>Usuarios</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid #2d3548', paddingTop: '12px' }}>
        <SignOutButton />
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create the CRM layout**

Create `app/crm/layout.tsx`:

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from './_components/Sidebar'

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/crm-login')

  return (
    <div className="flex min-h-screen" style={{ background: '#f8f9fb' }}>
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create the CRM root redirect**

Create `app/crm/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function CrmRootPage() {
  redirect('/crm/dashboard')
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | grep "crm" | head -10
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/crm/
git commit -m "feat: add CRM layout with sidebar and session-aware navigation"
```

---

## Task 7: Placeholder pages for all CRM modules

**Files:**
- Create: `app/crm/dashboard/page.tsx`
- Create: `app/crm/contactos/page.tsx`
- Create: `app/crm/pipeline/page.tsx`
- Create: `app/crm/webinars/page.tsx`
- Create: `app/crm/formularios/page.tsx`
- Create: `app/crm/campanas/page.tsx`
- Create: `app/crm/cursos/page.tsx`
- Create: `app/crm/ventas/page.tsx`
- Create: `app/crm/configuracion/page.tsx`

Each placeholder has the same structure. Create each file:

- [ ] **Step 1: Create dashboard placeholder**

Create `app/crm/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 9.</p>
    </div>
  )
}
```

- [ ] **Step 2: Create contactos placeholder**

Create `app/crm/contactos/page.tsx`:

```tsx
export default function ContactosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 2.</p>
    </div>
  )
}
```

- [ ] **Step 3: Create pipeline placeholder**

Create `app/crm/pipeline/page.tsx`:

```tsx
export default function PipelinePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 3.</p>
    </div>
  )
}
```

- [ ] **Step 4: Create webinars placeholder**

Create `app/crm/webinars/page.tsx`:

```tsx
export default function WebinarsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Webinars</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 4.</p>
    </div>
  )
}
```

- [ ] **Step 5: Create formularios placeholder**

Create `app/crm/formularios/page.tsx`:

```tsx
export default function FormulariosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Formularios</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 7.</p>
    </div>
  )
}
```

- [ ] **Step 6: Create campañas placeholder**

Create `app/crm/campanas/page.tsx`:

```tsx
export default function CampanasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 6.</p>
    </div>
  )
}
```

- [ ] **Step 7: Create cursos placeholder**

Create `app/crm/cursos/page.tsx`:

```tsx
export default function CursosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 8.</p>
    </div>
  )
}
```

- [ ] **Step 8: Create ventas placeholder**

Create `app/crm/ventas/page.tsx`:

```tsx
export default function VentasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
      <p className="mt-2 text-sm text-gray-500">Módulo en construcción — Sub-proyecto 8.</p>
    </div>
  )
}
```

- [ ] **Step 9: Create configuracion redirect**

Create `app/crm/configuracion/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function ConfiguracionPage() {
  redirect('/crm/configuracion/usuarios')
}
```

- [ ] **Step 10: Verify dev server loads all routes**

```bash
cd /Users/noeli/Documents/Develop/rui && npm run dev
```

Visit each route and confirm they render the placeholder without errors:
- `http://localhost:3000/crm/dashboard`
- `http://localhost:3000/crm/contactos`
- `http://localhost:3000/crm/pipeline`

- [ ] **Step 11: Commit**

```bash
git add app/crm/dashboard/ app/crm/contactos/ app/crm/pipeline/ app/crm/webinars/ app/crm/formularios/ app/crm/campanas/ app/crm/cursos/ app/crm/ventas/ app/crm/configuracion/page.tsx
git commit -m "feat: add placeholder pages for all CRM modules"
```

---

## Task 8: User management page

**Files:**
- Create: `app/crm/configuracion/usuarios/page.tsx`
- Create: `app/crm/configuracion/usuarios/_components/CreateUserModal.tsx`
- Create: `app/crm/configuracion/usuarios/actions.ts`

- [ ] **Step 1: Create server actions for user management**

Create `app/crm/configuracion/usuarios/actions.ts`:

```ts
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  role: z.enum(['ADMIN', 'EDITOR']),
})

type CreateUserState = {
  errors?: { name?: string[]; email?: string[]; password?: string[]; role?: string[] }
  message?: string
} | null

export async function createUser(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { message: 'No autorizado.' }

  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { errors: { email: ['Este correo ya está registrado.'] } }

  const hashed = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
      role: parsed.data.role,
    },
  })

  revalidatePath('/crm/configuracion/usuarios')
  return null
}

export async function deactivateUser(userId: number): Promise<void> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return

  // Prevent admin from deactivating themselves
  if (String(userId) === session.user.id) return

  await prisma.user.update({
    where: { id: userId },
    data: { active: false },
  })

  revalidatePath('/crm/configuracion/usuarios')
}
```

- [ ] **Step 2: Create the CreateUserModal client component**

Create `app/crm/configuracion/usuarios/_components/CreateUserModal.tsx`:

```tsx
'use client'

import { useActionState, useState } from 'react'
import { createUser } from '../actions'
import { X } from 'lucide-react'

type State = {
  errors?: { name?: string[]; email?: string[]; password?: string[]; role?: string[] }
  message?: string
} | null

export default function CreateUserModal({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    async (prev: State, formData: FormData) => {
      const result = await createUser(prev, formData)
      if (!result) {
        setOpen(false)
        onSuccess?.()
      }
      return result
    },
    null
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
        style={{ background: '#4f46e5' }}
      >
        + Nuevo usuario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-xl p-6 shadow-xl" style={{ background: '#1a1f2e', border: '1px solid #2d3548' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Nuevo usuario</h2>
              <button onClick={() => setOpen(false)} style={{ color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form action={action} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>
                  Nombre
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ background: '#0f1320', border: '1px solid #2d3548' }}
                />
                {state?.errors?.name && <p className="mt-1 text-xs text-red-400">{state.errors.name[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>
                  Correo electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ background: '#0f1320', border: '1px solid #2d3548' }}
                />
                {state?.errors?.email && <p className="mt-1 text-xs text-red-400">{state.errors.email[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>
                  Contraseña
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ background: '#0f1320', border: '1px solid #2d3548' }}
                />
                {state?.errors?.password && <p className="mt-1 text-xs text-red-400">{state.errors.password[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>
                  Rol
                </label>
                <select
                  name="role"
                  defaultValue="EDITOR"
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ background: '#0f1320', border: '1px solid #2d3548' }}
                >
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {state?.message && <p className="text-xs text-red-400">{state.message}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg py-2 text-sm font-medium transition"
                  style={{ background: '#2d3548', color: '#94a3b8' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                  style={{ background: '#4f46e5' }}
                >
                  {pending ? 'Creando…' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Create the users page**

Create `app/crm/configuracion/usuarios/page.tsx`:

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CreateUserModal from './_components/CreateUserModal'
import { deactivateUser } from './actions'

export default async function UsuariosPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/crm/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona el acceso al CRM</p>
        </div>
        <CreateUserModal />
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
        <table className="w-full text-sm">
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Correo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: user.role === 'ADMIN' ? '#ede9fe' : '#dbeafe',
                      color: user.role === 'ADMIN' ? '#6d28d9' : '#1d4ed8',
                    }}
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Editor'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: user.active ? '#dcfce7' : '#f3f4f6',
                      color: user.active ? '#15803d' : '#6b7280',
                    }}
                  >
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {user.createdAt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.active && String(user.id) !== session.user.id && (
                    <form action={async () => { 'use server'; await deactivateUser(user.id) }}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                      >
                        Dar de baja
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 5: Test user management manually**

```bash
cd /Users/noeli/Documents/Develop/rui && npm run dev
```

1. Login as admin (`admin@ruimachalele.com` / `AdminRui2026!`)
2. Navigate to `http://localhost:3000/crm/configuracion/usuarios`
3. Confirm admin user appears in the table
4. Click "+ Nuevo usuario", fill form, click "Crear usuario" → user appears in table
5. Click "Dar de baja" on the new user → status changes to Inactivo
6. Sign out, try logging in as the deactivated user → should show error

- [ ] **Step 6: Commit**

```bash
git add app/crm/configuracion/usuarios/
git commit -m "feat: add user management page with create and deactivate actions"
```
