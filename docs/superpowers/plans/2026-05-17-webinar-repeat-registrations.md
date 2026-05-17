# Webinar Repeat Registrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir que los re-registros del formulario `/webinar` siempre creen una entrada de actividad en el historial del contacto, y mostrar en la tabla de participantes cuántas veces se registró cada persona y en qué fechas.

**Architecture:** Se añaden dos campos a `WebinarRegistration` (`registrationCount`, `registrationDates`). El handler `handleWebinarSubmission` deja de usar `upsert` para poder actualizar esos campos, y siempre crea un `ContactActivity` (no solo en el primer registro). La `ParticipantsTable` muestra un badge expandible con la cuenta y las fechas.

**Tech Stack:** Next.js App Router, Prisma 7 (MariaDB), React 19, TypeScript, Tailwind

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `prisma/schema.prisma` | Modify | Añadir `registrationCount` y `registrationDates` a `WebinarRegistration` |
| `prisma/migrations/<timestamp>_add_registration_tracking/migration.sql` | Create | SQL que agrega las dos columnas |
| `app/actions.ts` | Modify | Reemplazar upsert por findFirst+create/update; siempre crear actividad |
| `app/crm/webinars/[id]/_components/ParticipantsTable.tsx` | Modify | Añadir tipo, estado, helpers y columna de registros con expansión |

El page query (`app/crm/webinars/[id]/page.tsx`) **no necesita cambios**: Prisma `include` ya devuelve todos los campos escalares del modelo, incluyendo los nuevos.

---

## Task 1: Schema + migración

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_registration_tracking/migration.sql`

- [ ] **Step 1: Modificar `prisma/schema.prisma`**

Ubicar el modelo `WebinarRegistration` (línea ~286) y reemplazarlo con:

```prisma
model WebinarRegistration {
  id                Int                @id @default(autoincrement())
  webinar           Webinar            @relation(fields: [webinarId], references: [id], onDelete: Cascade)
  webinarId         Int
  contact           Contact            @relation(fields: [contactId], references: [id], onDelete: Cascade)
  contactId         Int
  status            RegistrationStatus @default(REGISTERED)
  registrationCount Int                @default(1)
  registrationDates Json               @default("[]")
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@unique([webinarId, contactId])
  @@index([contactId, status])
  @@index([webinarId, status])
}
```

- [ ] **Step 2: Crear la carpeta de migración**

```bash
TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
mkdir -p "prisma/migrations/${TIMESTAMP}_add_registration_tracking"
echo "$TIMESTAMP"
```

Guarda el timestamp que imprime — lo necesitarás en el step 5.

- [ ] **Step 3: Escribir el SQL de migración**

Crear `prisma/migrations/<TIMESTAMP>_add_registration_tracking/migration.sql` con este contenido (reemplaza `<TIMESTAMP>` con el valor del step anterior):

```sql
-- AddColumn registrationCount and registrationDates to WebinarRegistration
ALTER TABLE `WebinarRegistration`
  ADD COLUMN `registrationCount` INT NOT NULL DEFAULT 1,
  ADD COLUMN `registrationDates` JSON NOT NULL DEFAULT (JSON_ARRAY());
```

- [ ] **Step 4: Ejecutar la migración en la base de datos**

```bash
npx prisma db execute --file "prisma/migrations/<TIMESTAMP>_add_registration_tracking/migration.sql"
```

Expected: Sin errores. Si hay error `DEFAULT (JSON_ARRAY())` no soportado, usar `DEFAULT '[]'` en su lugar.

- [ ] **Step 5: Marcar la migración como aplicada y regenerar el cliente**

```bash
npx prisma migrate resolve --applied "<TIMESTAMP>_add_registration_tracking"
npx prisma generate
```

Expected: `Migration <TIMESTAMP>_add_registration_tracking marked as applied` y luego `Generated Prisma Client`.

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "webinarregistration\|registrationCount\|registrationDates" | head -10
```

Expected: Sin errores.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma "prisma/migrations/<TIMESTAMP>_add_registration_tracking/"
git commit -m "feat: add registrationCount and registrationDates to WebinarRegistration"
```

---

## Task 2: Fix handleWebinarSubmission

**Files:**
- Modify: `app/actions.ts` (líneas ~134–166)

El handler actual usa `upsert` con `update: {}` — no actualiza nada en re-registros, y solo crea la actividad en el primer registro. Esto se reemplaza por `findUnique + create/update` explícito.

- [ ] **Step 1: Localizar el bloque a reemplazar en `app/actions.ts`**

```bash
grep -n "existingReg\|upsert\|contactActivity" app/actions.ts
```

Expected: líneas alrededor de 134–166 con `findUnique`, `upsert` y `contactActivity.create`.

- [ ] **Step 2: Reemplazar el bloque en `app/actions.ts`**

Dentro del `prisma.$transaction(async (tx) => { ... })`, reemplazar desde la línea del `const existingReg =` hasta el cierre del `if (!existingReg)` (inclusive) por este código:

```typescript
      const now = new Date()

      const existingReg = await tx.webinarRegistration.findUnique({
        where: {
          webinarId_contactId: {
            webinarId: WEBINAR_PUBLIC_ID,
            contactId,
          },
        },
        select: { id: true, registrationDates: true },
      })

      if (!existingReg) {
        await tx.webinarRegistration.create({
          data: {
            webinarId: WEBINAR_PUBLIC_ID,
            contactId,
            status: 'REGISTERED',
            registrationCount: 1,
            registrationDates: [now.toISOString()],
          },
        })
      } else {
        const prevDates = Array.isArray(existingReg.registrationDates)
          ? (existingReg.registrationDates as string[])
          : []
        await tx.webinarRegistration.update({
          where: {
            webinarId_contactId: {
              webinarId: WEBINAR_PUBLIC_ID,
              contactId,
            },
          },
          data: {
            registrationCount: { increment: 1 },
            registrationDates: [...prevDates, now.toISOString()],
          },
        })
      }

      await tx.contactActivity.create({
        data: {
          contactId,
          type: 'WEBINAR_REGISTERED',
          body: `Registro en el webinar «${webinarExists.title}».`,
        },
      })
```

**Nota:** El `await tx.contactActivity.create(...)` ya NO está dentro de un `if (!existingReg)` — siempre se ejecuta, tanto en primer registro como en re-registros.

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: Sin errores.

- [ ] **Step 4: Commit**

```bash
git add app/actions.ts
git commit -m "fix: always create ContactActivity on webinar registration, track count and dates"
```

---

## Task 3: Actualizar ParticipantsTable con badge de re-registros

**Files:**
- Modify: `app/crm/webinars/[id]/_components/ParticipantsTable.tsx`

- [ ] **Step 1: Actualizar el tipo `RegistrationWithContact`**

Añadir los dos campos nuevos al tipo (líneas ~9–15):

```typescript
export type RegistrationWithContact = {
  id: number
  status: RegistrationStatus
  createdAt: Date | string
  contactId: number
  registrationCount: number
  registrationDates: unknown
  contact: { id: number; name: string; email: string }
}
```

- [ ] **Step 2: Añadir helpers y estado de expansión**

Justo antes de la función `relativeTime`, añadir:

```typescript
function parseDates(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((d): d is string => typeof d === 'string') : []
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
```

Dentro de `ParticipantsTable`, añadir el estado de expansión junto a los otros `useState`:

```typescript
const [expandedId, setExpandedId] = useState<number | null>(null)
```

- [ ] **Step 3: Actualizar cabecera de columnas**

Reemplazar la línea de cabeceras (la que tiene `grid-cols-[1.5fr_1.5fr_1fr_0.7fr_0.3fr]`):

```tsx
      <div className={`grid grid-cols-[1.5fr_1.5fr_1fr_auto_0.7fr_0.3fr] px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] ${TOK.textSubtle}`}>
        <span>Contacto</span>
        <span>Email</span>
        <span>Estado</span>
        <span className="px-2">Registros</span>
        <span>Agregado</span>
        <span></span>
      </div>
```

- [ ] **Step 4: Reemplazar el bloque `registrations.map`**

Reemplazar todo el `{registrations.map((reg) => { ... })}` (desde línea ~108 hasta el cierre del map) por:

```tsx
      {registrations.map((reg) => {
        const currentStatus = statuses[reg.id] ?? reg.status
        const statusConfig = STATUS_OPTIONS.find((s) => s.value === currentStatus)
        const isMultiple = reg.registrationCount > 1
        const isExpanded = expandedId === reg.id
        const dates = parseDates(reg.registrationDates)
        return (
          <div key={reg.id} className="mb-1.5 last:mb-0">
            <div
              className={`grid grid-cols-[1.5fr_1.5fr_1fr_auto_0.7fr_0.3fr] items-center px-4 py-3 bg-[var(--color-surface-container-lowest)] ${isMultiple && isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
            >
              <a
                href={`/crm/contactos/${reg.contact.id}`}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {reg.contact.name}
              </a>
              <span className={`text-sm ${TOK.textSubtle}`}>{reg.contact.email}</span>
              <div>
                <select
                  value={currentStatus}
                  onChange={(e) =>
                    handleStatusChange(reg.id, e.target.value as RegistrationStatus)
                  }
                  aria-label={`Estado de ${reg.contact.name}`}
                  className={`rounded-[var(--radius-sm)] border-0 py-1 pl-2 pr-6 text-xs font-medium outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] ${statusConfig?.colorClass ?? ''}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-2">
                {isMultiple ? (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                    aria-label={`Ver ${reg.registrationCount} fechas de registro de ${reg.contact.name}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-tertiary-container)] px-2 py-0.5 text-xs font-semibold text-[var(--color-on-tertiary-container)]"
                  >
                    ×{reg.registrationCount} {isExpanded ? '▲' : '▼'}
                  </button>
                ) : (
                  <span className={`text-xs ${TOK.textSubtle}`}>×1</span>
                )}
              </div>
              <span className={`text-xs ${TOK.textSubtle}`}>{relativeTime(reg.createdAt)}</span>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(reg)}
                  aria-label={`Quitar a ${reg.contact.name}`}
                  className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            {isExpanded && dates.length > 0 && (
              <div className="rounded-b-2xl border border-t-0 border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                  Fechas de registro
                </p>
                <ul className="space-y-1">
                  {dates.map((date, i) => (
                    <li key={i} className={`text-xs ${TOK.textSubtle}`}>
                      {formatDate(date)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "ParticipantsTable" | head -10
```

Expected: Sin errores.

- [ ] **Step 6: Commit**

```bash
git add "app/crm/webinars/[id]/_components/ParticipantsTable.tsx"
git commit -m "feat: show registration count badge with expandable dates in ParticipantsTable"
```
