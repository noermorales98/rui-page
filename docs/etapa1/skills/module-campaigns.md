# Skill: module-campaigns

## Alcance
`/crm/campanas`. Email (SMTP) + WhatsApp (Cloud API) + templates + segmentos.

## Pre-lectura
- `sdd-loader`, `zod-validator`, `role-guard`, `audit-logger`.
- `INTEGRATIONS.md §2` (SMTP) y `§3` (WA Cloud).

## Estructura
```
app/crm/campanas/
  page.tsx
  nueva/page.tsx
  [id]/page.tsx                     # detalle + recipients status
  [id]/editar/page.tsx
  templates/page.tsx
  templates/[id]/page.tsx
  segmentos/page.tsx
  segmentos/[id]/page.tsx
  _components/
    CampaignsTable.tsx
    CampaignWizard.tsx              # 3 pasos
    AudienceBuilder.tsx
    TemplatePicker.tsx
    EmailEditor.tsx
    WhatsAppTemplatePicker.tsx
    RecipientsTable.tsx
lib/services/campaigns.ts
lib/services/templates.ts
lib/services/segments.ts
lib/integrations/smtp.ts
lib/integrations/whatsapp.ts
lib/segments/evaluator.ts
lib/validators/campaigns.ts
```

## Server actions
Ver `API_SPEC.md §4.6–4.8`.

## Wizard 3 pasos
1. **Básico** → name, channel (EMAIL|WHATSAPP), templateId?.
2. **Audiencia** → segmentId? o filtros inline. Muestra `recipientCount` + sample 10.
3. **Contenido**:
   - EMAIL: subject, previewText, fromName/Email, bodyHtml (editor), bodyText auto.
   - WHATSAPP: waTemplateName, waLanguage, waVariables JSON.
4. Botón "Enviar" → confirma y encola.

## Motor de segmentos
- Filtros DSL JSON:
  ```json
  {
    "and": [
      { "field":"status", "op":"in", "value":["NEW","QUALIFIED"] },
      { "field":"source", "op":"eq", "value":"WEBINAR" },
      { "or":[
        { "field":"tag", "op":"in", "value":["vip"] },
        { "field":"createdAt", "op":"gte", "value":"2026-01-01" }
      ]}
    ]
  }
  ```
- Traducir a `where` Prisma en `lib/segments/evaluator.ts`.
- Función `evaluateSegment(filters)` retorna `{ count, sampleIds }`.

## Envío
- `sendCampaign(id)`:
  1. Valida estado DRAFT.
  2. Calcula recipients finales → bulk insert `CrmCampaignRecipient` (PENDING).
  3. Marca status `SENDING`.
  4. Encola jobs (en MVP: invocar route handler `/api/jobs/campaign/[id]` con token).
- Worker procesa por batches (50 email / 100 WA), respetando rate limits.
- Por recipient: try send → SENT o FAILED + errorMessage.
- Al terminar: actualizar `sentCount`, `failedCount`, `sentAt`. Status: SENT (todos ok), PARTIAL (algún FAILED), FAILED (todos fail).

## SMTP
- Helper `sendEmail(...)` en `lib/integrations/smtp.ts`.
- Header `List-Unsubscribe` con URL `/unsubscribe?contactId=...&token=...`.

## WhatsApp Cloud
- Helper `sendWaTemplate({ to, templateName, language, components })`.
- Manejar errores: 24h window, plantilla no aprobada → marcar SKIPPED con razón.

## Reglas
- No editar campaña SENT/PARTIAL/FAILED. Solo clonar.
- Solo ADMIN/VENDEDOR envían.
- Activity `CAMPAIGN_SENT` en cada contact incluido.

## Testing
- Unit: evaluator de filtros (10 casos), state machine de status.
- E2E: crear campaña email + segmento → enviar (SMTP mock) → ver recipients.

## Done
- Cola con reintentos.
- Rate limits respetados.
- WA template validations (idioma + variables coinciden).
