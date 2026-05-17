# Webinar Repeat Registrations

## Goal

Corregir el bug por el que los registros del formulario `/webinar` no aparecen (o aparecen duplicados) en `/crm/webinars/[id]`, y añadir seguimiento de re-registros: cuando el mismo email se registra más de una vez al mismo webinar, mostrar cuántas veces y en qué fechas, sin crear un participante duplicado.

---

## 1. Cambio de Schema — `WebinarRegistration`

Añadir dos campos al modelo existente:

```prisma
model WebinarRegistration {
  // ... campos actuales sin cambio ...
  registrationCount Int  @default(1)    // total de veces que se registró
  registrationDates Json @default("[]") // ISO strings: ["2026-01-10T10:00:00Z", ...]
}
```

Los registros existentes conservan `count=1` y `dates=[]` (el `@default` aplica solo a filas nuevas; en la migración los existentes quedan con el valor por defecto del motor: `1` y `[]`).

Migración necesaria:
```sql
ALTER TABLE WebinarRegistration
  ADD COLUMN registrationCount INT NOT NULL DEFAULT 1,
  ADD COLUMN registrationDates JSON NOT NULL DEFAULT (JSON_ARRAY());
```

---

## 2. Fix del Handler — `app/actions.ts`

### Problema actual

`handleWebinarSubmission` usa `prisma.webinarRegistration.upsert`. El upsert no permite leer y modificar los campos JSON atómicamente, ni garantiza que `ContactActivity` siempre se cree en un re-registro.

### Nuevo flujo

Reemplazar el upsert por `findFirst + create/update` explícito:

```
1. Normalizar email (lowercase, trim)
2. Validar que el webinar WEBINAR_PUBLIC_ID exista → si no existe, retornar error legible al formulario (el form ya usa `useActionState` para mostrar errores)
3. Buscar o crear Contact por email (upsert sin cambio)
4. Buscar WebinarRegistration por { webinarId, contactId }
   a. Si NO existe:
      → prisma.webinarRegistration.create({
           registrationCount: 1,
           registrationDates: [now.toISOString()],
         })
   b. Si existe:
      → prisma.webinarRegistration.update({
           registrationCount: { increment: 1 },
           registrationDates: [...registro.registrationDates, now.toISOString()],
         })
5. SIEMPRE crear ContactActivity({ type: 'WEBINAR_REGISTERED', body: webinar.title })
   — tanto en primer registro como en cada re-registro
6. Enviar email de confirmación (sin cambio)
7. Redirect a /webinar/gracias (sin cambio)
```

El paso 4b requiere dos queries: primero leer `registrationDates`, luego escribir el array actualizado. Esto es aceptable dado el bajo volumen de re-registros.

**Unique factor:** email del contacto. `Contact.email` tiene `@unique` en el schema — nunca se crearán dos contactos con el mismo email.

---

## 3. CRM Display — `/crm/webinars/[id]`

### Query de participantes

Incluir `registrationCount` y `registrationDates` en la query de `ParticipantsTable`. No requiere join adicional — son campos del mismo modelo.

### Tabla de participantes

| Columna | Comportamiento |
|---------|---------------|
| Nombre | Sin cambio |
| Email | Sin cambio |
| Estado | Sin cambio |
| Registros | Nueva columna: badge `×N`. Si `registrationCount === 1`: texto `×1` sin énfasis. Si `> 1`: badge amber `×N` clickeable que expande las fechas inline debajo de la fila |
| Fecha | Primera fecha de registro (`registrationDates[0]` si existe, si no `createdAt` del registro) |
| Acciones | Sin cambio |

**Expansión de fechas** (cuando `registrationCount > 1`):

Al hacer click en el badge, se expande una sección inline bajo la fila (no modal, no tooltip) con la lista de fechas formateadas como `DD MMM YYYY, HH:mm`. Click de nuevo la colapsa.

```
Luis Mora    luis@hotmail.com    Asistió    ×3 ▼    10 ene 2026    ···
             10 ene 2026, 11:00
             18 ene 2026, 09:15
             01 feb 2026, 14:30
```

### Historial del contacto — `/crm/contactos/[id]`

Sin cambio visual. El fix del handler garantiza que cada registro (nuevo o repetido) crea una entrada `ContactActivity` de tipo `WEBINAR_REGISTERED`. La UI de actividad ya renderiza estas entradas cronológicamente.

---

## 4. Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Añadir `registrationCount`, `registrationDates` a `WebinarRegistration` |
| `prisma/migrations/…` | Migration SQL |
| `app/actions.ts` | Reemplazar upsert por findFirst + create/update; siempre crear ContactActivity |
| `app/crm/webinars/[id]/_components/ParticipantsTable.tsx` | Añadir columna Registros con badge + expansión inline |

---

## 5. Fuera de Scope

- Notificación al admin cuando alguien se re-registra
- Filtro/búsqueda por número de registros en el CRM
- Export CSV de fechas de re-registro
- Re-envío de email de confirmación en re-registros
