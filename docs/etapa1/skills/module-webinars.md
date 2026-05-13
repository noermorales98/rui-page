# Skill: module-webinars

## Alcance
`/crm/webinars`. CRUD + Zoom OAuth + sync + Streamyard manual.

## Pre-lectura
- `sdd-loader`, `zod-validator`, `role-guard`, `audit-logger`.
- `docs/sdd/INTEGRATIONS.md §4` (Zoom).

## Estructura
```
app/crm/webinars/
  page.tsx
  nuevo/page.tsx
  [id]/page.tsx                     # detalle + registrations
  _components/
    WebinarsTable.tsx
    WebinarForm.tsx
    RegistrationsTable.tsx
    ZoomLinkDialog.tsx
app/api/integrations/zoom/callback/route.ts
app/api/zoom/webhook/route.ts
lib/services/webinars.ts
lib/integrations/zoom.ts
lib/validators/webinars.ts
```

## Server actions
- `listWebinars`, `getWebinar`.
- `createWebinar`, `updateWebinar`, `softDeleteWebinar`.
- `linkZoomWebinar(webinarId, zoomMeetingId)` → crea `WebinarIntegration`.
- `syncZoomRegistrations(webinarId)`.
- `markAttendance(registrationId, status)`.

## Zoom OAuth
- Settings (ADMIN): botón "Conectar Zoom" → redirect a Zoom OAuth.
- Callback `/api/integrations/zoom/callback` guarda token + refresh en `Integration.config` (cifrado).
- Refresh automático antes de cada llamada.

## Sync registrants
1. Llamar Zoom API `GET /webinars/{id}/registrants`.
2. Para cada uno: dedupe Contact por email, crear `WebinarRegistration` si no existe.
3. `ContactActivity` type `WEBINAR_REGISTERED`.

## Webhook Zoom
- `webinar.registration_created` → mismo flujo que sync.
- `webinar.participant_joined` → marcar `ATTENDED`, `ContactActivity` `WEBINAR_ATTENDED`.
- Verificar `verification_token` o firma según método configurado.

## Streamyard
- Sin API. UI permite cargar manualmente: nº registrados, asistentes, compradores.
- Estos números actualizan métricas del dashboard pero NO crean registrations individuales.

## Reglas
- Un Contact se registra máx 1 vez por Webinar (`@@unique`).
- Cron job de sync corre cada 15 min para webinars en las próximas 24h o terminados hace <2h.

## Testing
- Unit: dedupe registrants, OAuth refresh.
- E2E (con Zoom mock): conectar Zoom → vincular webinar → sync → ver registrations.

## Done
- Tokens cifrados.
- Webhook verifica firma.
- Refresh token funciona.
