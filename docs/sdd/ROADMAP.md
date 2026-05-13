# ROADMAP — CRM Rui

> Plan basado en proyecto existente (no green-field). El orden minimiza retrabajo y desbloquea integraciones críticas temprano.

## Sprint 0 — Alineación SDD (1–2 días)
- [ ] Generar y revisar los 9 docs SDD (este folder).
- [ ] Reescribir `AGENTS.md` y `CLAUDE.md` referenciando los docs SDD.
- [ ] Auditar `app/` real vs `API_SPEC.md`. Listar gaps reales.
- [ ] Inventario de componentes UI existentes vs `STYLE_GUIDE.md`.

## Sprint 1 — Schema final + Auth (2–3 días)
- [ ] Aplicar cambios de schema (`DATA_MODEL.md` §5).
- [ ] Migración Prisma + seed de dev (1 admin, 1 vendedor, 1 asistente).
- [ ] Helper `requireRole`.
- [ ] Refactor de páginas para usar los 3 roles.
- [ ] Modelos Auth.js (Account/Session/VerificationToken) listos.

## Sprint 2 — Contactos + Tags + Activity (2–3 días)
- [ ] CRUD Contact con Zod.
- [ ] Soft delete activo.
- [ ] Import CSV con reporte de errores.
- [ ] Tags CRUD + asignación.
- [ ] Timeline de actividad en vista detalle.
- [ ] AuditLog en mutaciones.

## Sprint 3 — Pipeline + AuditLog general (2 días)
- [ ] Kanban con `@dnd-kit` para Deal stages.
- [ ] Crear Deal desde Contact.
- [ ] `moveDeal` con `STAGE_CHANGE` log.
- [ ] Vista de detalle de Deal con timeline.

## Sprint 4 — Formularios (3–4 días)
- [ ] Builder drag & drop de campos.
- [ ] Lógica condicional (`config.showWhen`) en builder y render.
- [ ] Página pública `/formularios/[slug]`.
- [ ] Embed iframe `/embed/formularios/[slug]`.
- [ ] Endpoint `/api/forms/[slug]/submit` con rate limit.
- [ ] Dedupe contact por email/teléfono.
- [ ] Listado de submissions por form.

## Sprint 5 — Webinars + Zoom (3 días)
- [ ] CRUD Webinar.
- [ ] Tabla `Integration` + UI conexión OAuth Zoom.
- [ ] Sync de registrants (manual + cron).
- [ ] Webhook Zoom (asistencia).
- [ ] Streamyard: registro manual de métricas.

## Sprint 6 — Stripe + Ventas (3 días)
- [ ] Tabla `StripeEvent`.
- [ ] Webhook `/api/stripe/webhook` con verificación firma.
- [ ] `recordSaleFromStripe`.
- [ ] Creación de Checkout Session desde Deal.
- [ ] UI ventas con filtros y refunds.
- [ ] Subida automática Contact → CLIENT.

## Sprint 7 — Plantillas + Segmentos (2 días)
- [ ] CRUD `CampaignTemplate`.
- [ ] CRUD `Segment` con motor de evaluación.
- [ ] `previewAudience` consume Segment o filtros inline.

## Sprint 8 — Campañas Email (3 días)
- [ ] CRUD `CrmCampaign` (channel=EMAIL).
- [ ] Editor (rich text simple).
- [ ] Envío vía SMTP con cola en cron + reintentos.
- [ ] Tracking de status por recipient.
- [ ] List-Unsubscribe.

## Sprint 9 — Campañas WhatsApp (2–3 días)
- [ ] Channel WHATSAPP en campañas.
- [ ] Selección de waTemplateName + idioma + variables.
- [ ] Envío vía WA Cloud API.
- [ ] Webhook estados → actualizar `CrmCampaignRecipient`.

## Sprint 10 — Dashboard + Settings (2 días)
- [ ] Métricas agregadas en dashboard (queries optimizadas).
- [ ] Feed de actividad reciente.
- [ ] Settings: usuarios (ADMIN), integraciones (ADMIN), perfil propio.
- [ ] Vista AuditLog (ADMIN).

## Sprint 11 — QA + Tests (Etapa 2 del proceso) (3–4 días)
- [ ] Setup Vitest + Playwright.
- [ ] Unit tests críticos (sales, campaigns send, forms submit, stripe webhook).
- [ ] E2E flujos: login, crear contacto, mover deal, submit form, enviar campaña, recibir pago Stripe (mock).
- [ ] Skill `reviewer-agent` (revisión de PRs por agente).

## Sprint 12 — Hardening + Deploy (2 días)
- [ ] CSP + headers seguridad.
- [ ] Cifrado de `Integration.config`.
- [ ] Rate limits en endpoints públicos.
- [ ] `.env.example` final.
- [ ] Deploy a Vercel + cron jobs configurados.
- [ ] Smoke test producción.

---

## Total estimado
~30–35 días de trabajo enfocado (solo desarrollador). Aceleración esperada con agentes en paralelo: 40–50% (Etapa 1).

## Criterios de "Done" por sprint
- Código pasa lint + typecheck.
- Tests de la feature crítica del sprint pasan.
- Doc SDD actualizado si hubo cambios.
- AuditLog cubriendo mutaciones del sprint.
- Revisión humana de la rama antes de merge a `main`.
