# ARCHITECTURE — CRM Rui

## 1. Stack
- **Framework:** Next.js 16 (App Router, RSC).
- **Lenguaje:** TypeScript estricto.
- **UI:** Tailwind v4 + Hugeicons + Lucide.
- **DnD:** @dnd-kit/core.
- **ORM:** Prisma 7 + `@prisma/adapter-mariadb`.
- **DB:** MariaDB (Hostinger).
- **Auth:** Auth.js v5 (Credentials + JWT, Account/Session listos para OAuth futuro).
- **Email:** Nodemailer + SMTP propio.
- **WhatsApp:** Meta WhatsApp Cloud API.
- **Pagos:** Stripe (Checkout + webhooks).
- **Webinars:** Zoom API + Streamyard manual.
- **Validación:** Zod.
- **Forms cliente:** react-hook-form + @hookform/resolvers/zod.
- **Tests:** Vitest (unit), Playwright (e2e).
- **Deploy:** Vercel.
- **Cron:** Vercel Cron Jobs (sync Zoom, retries WA).

## 2. Capas
```
app/                  → rutas, server components, server actions
  (auth)/             → login, register
  (public)/           → formularios públicos, embed
  crm/                → app autenticada
    dashboard/
    contactos/
    pipeline/
    ventas/
    webinars/
    formularios/
    campanas/
    settings/
  api/                → route handlers (webhooks, oauth callbacks)
    stripe/webhook/
    whatsapp/webhook/
    zoom/webhook/
    forms/[slug]/submit/
lib/
  db/                 → prisma client, helpers
  auth/               → auth.ts, permissions
  services/           → contacts, deals, sales, campaigns, forms, webinars
  integrations/       → stripe, smtp, whatsapp, zoom
  segments/           → motor de filtros dinámicos
  validators/         → schemas Zod
  audit/              → logger AuditLog
components/           → UI compartida
types/                → tipos globales
prisma/               → schema, migraciones, seeds
docs/sdd/             → fuente de verdad SDD
```

## 3. Flujo de datos
- **Lectura:** RSC → service (lib/services/*) → Prisma → DB.
- **Mutación:** server action → validador Zod → service → Prisma → AuditLog → ContactActivity.
- **Webhooks externos:** route handler `/api/*/webhook` → verifica firma → service → Prisma.
- **Outbound (campañas):** server action encola → job worker (Vercel cron / edge function) → SMTP o WA Cloud.

## 4. Integraciones
| Servicio | Tipo | Dirección | Auth |
|---|---|---|---|
| Stripe | Pagos | inbound (webhook) + outbound (Checkout) | Webhook signing secret |
| SMTP propio | Email | outbound | usuario/pass en env |
| WhatsApp Cloud | Mensajería | inbound + outbound | Token Meta + webhook verify |
| Zoom | Webinars | inbound (webhook) + outbound (REST) | OAuth + verification token |
| Streamyard | Webinars | manual | n/a |

Toda la config de integraciones vive en tabla `Integration` (provider, status, config JSON cifrado).

## 5. Seguridad
- Server actions con check de rol (helper `requireRole`).
- Validación Zod obligatoria antes de tocar DB.
- Webhooks: verificación de firma siempre.
- Secrets en env (Vercel), nunca en repo.
- Rate limit en endpoints públicos (forms submit).
- CSP estricta en producción.

## 6. Observabilidad
- AuditLog en cada mutación importante.
- Logs estructurados (JSON) en servicios.
- Sentry (opcional Etapa 2).

## 7. Performance
- Server components por defecto.
- Cliente solo cuando hay interactividad real (Kanban, builder de formularios, editores).
- Paginación en tablas (cursor o offset según caso).
- Índices DB ya definidos (ver `DATA_MODEL.md`).
