# Skill: module-landings

## Alcance
`/crm/landings` (panel) + `/l/[slug]` (público). Constructor de landing pages con bloques predefinidos + HTML/CSS libre.

## Pre-lectura
- `sdd-loader`, `zod-validator`, `role-guard`, `audit-logger`, `error-handling`.
- `landing-builder.md` (mecánica del builder).
- `ui-component.md`, `rsc-patterns.md`, `i18n-spanish.md`.
- Si conecta con flow: `module-flows.md`.

## Estructura
```
app/crm/landings/
  page.tsx                          # listado
  nueva/page.tsx
  [id]/page.tsx                     # builder
  [id]/ajustes/page.tsx             # SEO + form + flow vinculado
  [id]/metricas/page.tsx
  _components/
    LandingsTable.tsx
    LandingSettingsForm.tsx
    LandingBlockEditor.tsx
    LandingPreview.tsx
    BlockPalette.tsx
    CustomHtmlEditor.tsx
app/(public)/l/[slug]/page.tsx
app/api/landings/[slug]/submit/route.ts
lib/services/landings.ts
lib/validators/landings.ts
lib/landings/render.ts
lib/landings/sanitize.ts
```

## Server actions
- `listLandings`, `getLanding`.
- `createLanding`, `updateLanding`, `softDeleteLanding`.
- `publishLanding`, `archiveLanding`.
- `saveBlocks(landingId, blocks)` — diff + transacción.
- `getLandingMetrics(id)` — views, submits, conversion rate.

## Bloques predefinidos (`LandingBlockType`)
- **HERO**: `{ title, subtitle, bgImageUrl?, ctaText?, ctaHref? }`
- **VIDEO**: `{ provider: "youtube"|"vimeo"|"file", url, aspect }`
- **CTA**: `{ heading, body?, buttonText, buttonHref, variant }`
- **FORM_EMBED**: `{ formId }` → reusa `CrmForm`
- **TESTIMONIALS**: `{ items: [{name, role, quote, avatarUrl?}] }`
- **FAQ**: `{ items: [{q, a}] }`
- **FOOTER**: `{ text, links: [{label, href}] }`
- **CUSTOM_HTML**: `{ html, css }` — sanitizado server-side

## Builder
- Drag&drop con `@dnd-kit`.
- Paleta de bloques arrastrable al canvas.
- Editor lateral con props del bloque seleccionado.
- Preview en vivo (mismo render que público).
- Atajos: Delete borra bloque, Esc deselecciona.

## Render público `/l/[slug]`
1. Server component.
2. Buscar landing PUBLISHED por slug. Si no → `notFound()`.
3. Registrar `LandingView` (fire-and-forget, no bloquea render):
   - Hash IP+UA con HMAC SHA-256 + clave env.
   - Capturar UTM de query.
4. Aplicar `customHead`/`customCss` sanitizados.
5. Renderizar bloques en orden.

## Submit propio `/api/landings/[slug]/submit`
1. Rate limit por IP (5/min).
2. Buscar landing PUBLISHED con `ownFormConfig`.
3. Validar payload contra schema dinámico del `ownFormConfig`.
4. Crear/actualizar Contact (dedupe email).
5. `ContactActivity` type `FORM_SUBMITTED`.
6. Si `landing.flowId` → llamar `dispatch("LANDING_SUBMITTED", { landingId, contactId })`.
7. Si flow tiene REDIRECT como primer step → devolver `{ redirectUrl }`.
8. Si no → devolver `{ ok: true, message }`.

## Form propio (`ownFormConfig`)
JSON schema simple:
```json
{
  "fields": [
    { "key":"name", "label":"Nombre", "type":"text", "required":true },
    { "key":"email", "label":"Email", "type":"email", "required":true },
    { "key":"phone", "label":"Teléfono", "type":"tel", "required":false }
  ],
  "submitLabel": "Quiero entrar",
  "successMessage": "Recibimos tus datos"
}
```

## SEO
- Page metadata desde `landing.title`, `landing.description`, `landing.ogImageUrl`.
- robots: `index,follow` por default.

## Sanitización (`lib/landings/sanitize.ts`)
- DOMPurify + jsdom server-side.
- Tags permitidos: ver `SDD_DELTA §G`.
- iframe solo `youtube.com`, `vimeo.com`.
- CSS sin `expression()`.
- Ejecutar SIEMPRE antes de guardar `customHtml`, `customCss`, `customHead`.

## Tracking
- `LandingView` con IP+UA hasheados (privacidad).
- `referer`, `utm`.
- Conversion rate = submits / views.

## Reglas
- Solo PUBLISHED tracked y submittable.
- Borrar landing con flow vinculado: setNull en Flow, no bloquea.
- AuditLog en CREATE, UPDATE, PUBLISH, ARCHIVE, DELETE.

## Testing
- Unit: sanitización (script tag, iframe externo, expression CSS).
- Unit: dedupe Contact por submit.
- E2E: crear landing con 3 bloques, publicar, visitar → view registrado, submit → contact creado.

## Done
- Render público < 1.5s FCP.
- Sanitización 100% efectiva (revisar con casos de XSS comunes).
- Builder usable sin recargar.
