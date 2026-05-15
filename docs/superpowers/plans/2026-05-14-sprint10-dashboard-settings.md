# Sprint 10 — Dashboard + Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el módulo de Settings con vista AuditLog (ADMIN) y página de perfil propio; el dashboard ya tiene métricas y feed de actividad.

**Architecture:**
- `/crm/configuracion/auditlog` — tabla paginada de AuditLog, filtrable por entityType y acción. Solo ADMIN.
- `/crm/configuracion/perfil` — formulario para cambiar nombre y contraseña del usuario en sesión. Todos los roles.
- Ambas pages son RSC con server actions para las mutaciones.

**Tech Stack:** Next.js App Router RSC + server actions, Prisma 7, bcryptjs (ya instalado para auth), TOK design tokens.

---

## File Map

| Action | Path |
|--------|------|
| Create | `app/crm/configuracion/auditlog/page.tsx` |
| Create | `app/crm/configuracion/perfil/page.tsx` |
| Create | `app/crm/configuracion/perfil/actions.ts` |
| Modify | `app/crm/configuracion/page.tsx` (add AuditLog + Perfil links) |

---

### Task 1: AuditLog page (ADMIN only)

**Files:**
- Create: `app/crm/configuracion/auditlog/page.tsx`

- [ ] **Step 1: Create `app/crm/configuracion/auditlog/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  searchParams: Promise<{ page?: string; entity?: string; action?: string }>
}

const PAGE_SIZE = 50

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Crear',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  STATUS_CHANGE: 'Cambio estado',
  STAGE_CHANGE: 'Cambio etapa',
}

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function AuditLogPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/crm/configuracion')

  const query = await searchParams
  const page = Math.max(1, Number(query.page) || 1)
  const entityFilter = query.entity?.trim() || undefined
  const actionFilter = query.action?.trim() || undefined

  const where = {
    ...(entityFilter ? { entityType: entityFilter } : {}),
    ...(actionFilter ? { action: actionFilter as never } : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Distinct entity types for filter dropdown
  const entityTypes = await prisma.auditLog.findMany({
    distinct: ['entityType'],
    select: { entityType: true },
    orderBy: { entityType: 'asc' },
  })

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (entityFilter) params.set('entity', entityFilter)
    if (actionFilter) params.set('action', actionFilter)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Auditoría</h1>
        <p className={TOK.textMuted}>{total} registros</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select
          name="entity"
          defaultValue={entityFilter ?? ''}
          className={`${TOK.inputNative} w-auto`}
        >
          <option value="">Todas las entidades</option>
          {entityTypes.map(({ entityType }) => (
            <option key={entityType} value={entityType}>{entityType}</option>
          ))}
        </select>
        <select
          name="action"
          defaultValue={actionFilter ?? ''}
          className={`${TOK.inputNative} w-auto`}
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className={TOK.actionSecondary}>Filtrar</button>
        {(entityFilter || actionFilter) && (
          <Link href="/crm/configuracion/auditlog" className={TOK.actionSecondary}>Limpiar</Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
              {['Fecha', 'Actor', 'Entidad', 'ID', 'Acción'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline-variant)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-on-surface-variant)]">
                  Sin registros
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-on-surface-variant)]">
                    {dateFmt.format(new Date(row.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-on-surface)]">
                    {row.actor?.name ?? row.actor?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{row.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-on-surface-variant)]">{row.entityId}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-[var(--radius-sm)] bg-[var(--color-surface-container-high)] px-2 py-0.5 text-xs font-medium text-[var(--color-on-surface)]">
                      {ACTION_LABELS[row.action] ?? row.action}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className={TOK.actionSecondary}>Anterior</Link>
          )}
          <span className="text-sm text-[var(--color-on-surface-variant)]">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className={TOK.actionSecondary}>Siguiente</Link>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

If there is a type error on `action: actionFilter as never` try using `action: actionFilter as Prisma.EnumAuditActionFilter` or just use a raw `Prisma.AuditLogWhereInput` type. Check with:
```bash
grep "AuditAction\b" /Users/noeli/Documents/Develop/rui/node_modules/.prisma/client/index.d.ts | head -3
```

- [ ] **Step 3: Commit**

```bash
git add app/crm/configuracion/auditlog/
git commit -m "feat: AuditLog page — paginated, filterable by entity and action (ADMIN only)"
```

---

### Task 2: Perfil propio page + server actions

**Files:**
- Create: `app/crm/configuracion/perfil/actions.ts`
- Create: `app/crm/configuracion/perfil/page.tsx`

- [ ] **Step 1: Create `app/crm/configuracion/perfil/actions.ts`**

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

type ProfileState = { error?: string; message?: string } | null

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autorizado' }

  const parsed = profileSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    await prisma.user.update({
      where: { id: Number(session.user.id) },
      data: { name: parsed.data.name },
    })
    revalidatePath('/crm/configuracion/perfil')
    return { message: 'Perfil actualizado' }
  } catch {
    return { error: 'Error al actualizar el perfil' }
  }
}

export async function changePassword(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autorizado' }

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { password: true },
  })
  if (!user?.password) return { error: 'Este usuario no tiene contraseña configurada' }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
  if (!valid) return { error: 'Contraseña actual incorrecta' }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { password: hashed },
  })

  return { message: 'Contraseña cambiada correctamente' }
}
```

- [ ] **Step 2: Create `app/crm/configuracion/perfil/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { Card } from '@/app/crm/_components/ui'
import { ProfileForm } from './_components/ProfileForm'
import { PasswordForm } from './_components/PasswordForm'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { name: true, email: true, role: true },
  })
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Mi perfil</h1>

      <Card className="max-w-lg">
        <h2 className={`mb-4 ${TOK.sectionTitle}`}>Información personal</h2>
        <p className="mb-4 text-sm text-[var(--color-on-surface-variant)]">
          {user.email} · <span className="font-medium">{user.role}</span>
        </p>
        <ProfileForm currentName={user.name ?? ''} />
      </Card>

      <Card className="max-w-lg">
        <h2 className={`mb-4 ${TOK.sectionTitle}`}>Cambiar contraseña</h2>
        <PasswordForm />
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/crm/configuracion/perfil/_components/ProfileForm.tsx`**

```typescript
'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { updateProfile } from '../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function ProfileForm({ currentName }: { currentName: string }) {
  const [state, action, pending] = useActionState(updateProfile, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
      {state?.message && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
          {state.message}
        </p>
      )}
      <div>
        <label className={TOK.label}>Nombre</label>
        <input name="name" required minLength={2} defaultValue={currentName} className={TOK.inputNative} />
      </div>
      <button type="submit" disabled={pending} className={`${TOK.actionPrimary} w-full justify-center`}>
        <Save size={15} />
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Create `app/crm/configuracion/perfil/_components/PasswordForm.tsx`**

```typescript
'use client'

import { useActionState } from 'react'
import { KeyRound } from 'lucide-react'
import { changePassword } from '../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
      {state?.message && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
          {state.message}
        </p>
      )}
      <div>
        <label className={TOK.label}>Contraseña actual</label>
        <input name="currentPassword" type="password" required className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Nueva contraseña</label>
        <input name="newPassword" type="password" required minLength={8} className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Confirmar nueva contraseña</label>
        <input name="confirmPassword" type="password" required className={TOK.inputNative} />
      </div>
      <button type="submit" disabled={pending} className={`${TOK.actionPrimary} w-full justify-center`}>
        <KeyRound size={15} />
        {pending ? 'Cambiando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

If `bcrypt` import fails check: `grep "bcryptjs\|bcrypt" /Users/noeli/Documents/Develop/rui/package.json`. Use the package name that's installed.

- [ ] **Step 6: Commit**

```bash
git add app/crm/configuracion/perfil/
git commit -m "feat: Perfil page — update name + change password"
```

---

### Task 3: Add AuditLog + Perfil links to configuracion index

**Files:**
- Modify: `app/crm/configuracion/page.tsx`

- [ ] **Step 1: Read the current configuracion page**

The file has a `sections` array with items `{ href, label, description }`. Add two new entries:

```typescript
{ href: '/crm/configuracion/perfil', label: 'Mi perfil', description: 'Actualiza tu nombre y contraseña.' },
{ href: '/crm/configuracion/auditlog', label: 'Auditoría', description: 'Historial de cambios y acciones del sistema.', adminOnly: true },
```

However, the current structure renders all sections without role filtering. Add an `adminOnly?: boolean` field and filter by session role.

- [ ] **Step 2: Modify `app/crm/configuracion/page.tsx`**

Read the file first, then make these changes:
1. Import `auth` from `@/auth` at the top
2. Make the component `async` and get `const session = await auth()`
3. Add `adminOnly?: boolean` to the sections array type (inline)
4. Filter: `sections.filter(s => !s.adminOnly || session?.user?.role === 'ADMIN')`
5. Add the two new sections to the array

- [ ] **Step 3: Also add a "Perfil" link to the SidebarNav bottom section**

Check `app/crm/_components/SidebarNav.tsx`. Add to `CONFIG_ITEMS`:
```typescript
{ label: 'Mi perfil', href: '/crm/configuracion/perfil', icon: UserAccountIcon },
```

Place it before `Configuración` or after `Etiquetas`. All roles can see it (no `roles` filter).

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add app/crm/configuracion/page.tsx app/crm/_components/SidebarNav.tsx
git commit -m "feat: add AuditLog + Perfil links to configuracion nav"
```

---

## Self-Review

**Spec coverage:**
- ✅ Dashboard — already complete with metrics + activity feed (no changes needed)
- ✅ Settings: usuarios (ADMIN) — already existed
- ✅ Settings: integraciones (ADMIN) — already existed  
- ✅ Settings: perfil propio — new (Tasks 2–3)
- ✅ Vista AuditLog (ADMIN) — new (Task 1)

**No placeholders.**

**Type consistency:** `updateProfile` and `changePassword` both use `ProfileState`. `bcrypt.compare` and `bcrypt.hash` require `bcryptjs` which is imported as `import bcrypt from 'bcryptjs'` — consistent with how auth.ts uses it in this codebase.
