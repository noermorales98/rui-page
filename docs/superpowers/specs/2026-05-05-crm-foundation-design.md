# CRM Foundation — Design Spec
Date: 2026-05-05
Sub-project: 1 of 9

## Overview

Build the foundation layer for a full CRM (webinar leads, email marketing, course sales) inside the existing `rui` Next.js 16 / React 19 project. This sub-project delivers: database connection via Prisma + MariaDB, multi-user authentication via NextAuth.js v5, the CRM shell layout (sidebar + content area), and user management (admin can create and deactivate users).

All subsequent CRM sub-projects build on top of this foundation.

## Tech Stack

- **ORM:** Prisma 6.x with `@prisma/client` — MariaDB/MySQL provider
- **Auth:** NextAuth.js v5 (`next-auth@beta`) with CredentialsProvider
- **Password hashing:** `bcryptjs`
- **DB:** MariaDB at `82.197.82.158`, database `u627288392_ruicrm`, user `u627288392_ruicrm`
- **Styling:** Tailwind CSS v4 (already in project)

## Route Structure

```
app/
├── crm/
│   ├── layout.tsx                    ← CRM shell: sidebar + content wrapper (server component)
│   ├── page.tsx                      ← redirect to /crm/dashboard
│   ├── dashboard/page.tsx            ← placeholder (built in sub-project 9)
│   ├── contactos/page.tsx            ← placeholder (built in sub-project 2)
│   ├── pipeline/page.tsx             ← placeholder (built in sub-project 3)
│   ├── webinars/page.tsx             ← placeholder (built in sub-project 4)
│   ├── formularios/page.tsx          ← placeholder (built in sub-project 7)
│   ├── campanas/page.tsx             ← placeholder (built in sub-project 6)
│   ├── cursos/page.tsx               ← placeholder (built in sub-project 8)
│   ├── ventas/page.tsx               ← placeholder (built in sub-project 8)
│   └── configuracion/
│       ├── page.tsx                  ← redirect to /crm/configuracion/usuarios
│       └── usuarios/page.tsx         ← user management (admin only)
├── crm-login/
│   └── page.tsx                      ← login form
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts              ← NextAuth handler
```

```
middleware.ts                         ← root middleware, protects /crm/* routes
auth.ts                               ← NextAuth config (root)
prisma/
├── schema.prisma
└── seed.ts                           ← creates first admin user
lib/
└── prisma.ts                         ← Prisma client singleton
```

## Database Schema (Sub-project 1 only)

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

`DATABASE_URL` in `.env`: `mysql://u627288392_ruicrm:<password>@82.197.82.158:3306/u627288392_ruicrm`

## Authentication Flow

1. User submits email + password at `/crm-login`
2. NextAuth `CredentialsProvider.authorize()`:
   - Finds user by email via Prisma
   - Checks `active === true` — if not, returns null (login rejected)
   - Compares password with `bcryptjs.compare()` — if mismatch, returns null
   - Returns `{ id, name, email, role }` on success
3. NextAuth creates a JWT session with `{ id, name, email, role }`
4. `middleware.ts` checks for valid session on every `/crm/*` request — redirects to `/crm-login` if missing
5. Session `role` is available in server components via `auth()` and in client via `useSession()`

**Login page:** Dark background (`#1a1f2e`), centered card with email + password inputs, error message inline if credentials fail or user is inactive. No registration link (users are created by admin only).

## CRM Layout

`app/crm/layout.tsx` is a server component that calls `auth()` to get the session, then renders:

**Sidebar** (fixed, dark `#1a1f2e`, width `240px`):
- App name "Rui CRM" at top
- User name + role badge below
- Navigation links with icons (Lucide React):
  - Dashboard → `/crm/dashboard`
  - Contactos → `/crm/contactos`
  - Pipeline → `/crm/pipeline`
  - Webinars → `/crm/webinars`
  - Formularios → `/crm/formularios`
  - Campañas → `/crm/campanas`
  - Cursos → `/crm/cursos`
  - Ventas → `/crm/ventas`
  - Configuración → `/crm/configuracion` (shows "Usuarios" sub-link only if role === ADMIN)
- Sign out button at bottom (calls NextAuth `signOut`)

**Content area** (flex-1, bg `#f8f9fb`, scrollable):
- Top bar with page title (passed as prop or derived from pathname)
- `{children}`

**Color palette:**
- Sidebar bg: `#1a1f2e`
- Sidebar text: `#94a3b8`
- Sidebar active link: `#4f46e5` accent with white text
- Content bg: `#f8f9fb`
- Accent: `#4f46e5` (indigo)
- Cards: white with `shadow-sm` and `rounded-xl`

## User Management (`/crm/configuracion/usuarios`)

**Access:** Admin only. If an editor navigates here, redirect to `/crm/dashboard`.

**View:**
- Table: Name | Email | Role | Status | Created | Actions
- Status badge: green "Activo" / gray "Inactivo"
- "Nuevo usuario" button → opens modal

**Create user modal:**
- Fields: Nombre (required), Email (required, unique), Contraseña (required, min 8 chars), Rol (select: Admin / Editor)
- Server action: hash password with bcryptjs, insert via Prisma, revalidate page
- Error if email already exists

**Deactivate user:**
- "Dar de baja" button → confirmation dialog → sets `active = false` via server action
- Deactivated users lose access on their next login. Active JWT sessions remain valid until they expire (NextAuth default: 30 days). For immediate revocation, the session maxAge should be set to a short value (e.g., 8 hours) in the NextAuth config.
- An admin cannot deactivate themselves

**No delete:** Users are never deleted from the database, only deactivated.

## Seed Script (`prisma/seed.ts`)

Creates one initial admin user:
- Name: "Rui Machalele"
- Email: `admin@ruimachalele.com`
- Password: hashed from env var `SEED_ADMIN_PASSWORD`
- Role: ADMIN

Run once with `npx prisma db seed`.

## Placeholder Pages

Each CRM module page (dashboard, contactos, etc.) renders a simple placeholder:
- Page title
- "Módulo en construcción" message
- Link back to dashboard

These get replaced in subsequent sub-projects.

## What is NOT in scope

- Any CRM data models beyond `User`
- Email sending
- Any module beyond user management
- Public-facing pages (they are untouched)
- Role-based access beyond the usuarios page restriction
