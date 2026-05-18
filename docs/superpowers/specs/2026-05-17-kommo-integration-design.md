# Kommo CRM Integration — Design Spec

**Fecha:** 2026-05-17  
**Estado:** Aprobado

---

## Objetivo

Cuando un usuario envía un formulario público (`/api/forms/[slug]/submit`), crear automáticamente un lead en Kommo CRM con los datos de contacto (nombre, email, teléfono) y el slug del formulario como tag.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| ¿Pipeline/status/field IDs hardcoded o dinámicos? | Dinámicos — obtenidos de la API de Kommo |
| Cache de IDs | En memoria (variable de módulo). Reset al reiniciar el servidor |
| ¿Qué pasa si Kommo falla? | Error silencioso: el submit del formulario tiene éxito igual, se loguea el error con `console.error` |
| ¿Dónde se llama a Kommo? | En `app/api/forms/[slug]/submit/route.ts` después de que `submitForm()` retorna `ok: true` |
| ¿Funnels también? | No — MVP aplica solo a formularios (`/api/forms/[slug]/submit`) |

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `KOMMO_BASE_URL` | URL base de la cuenta, ej. `https://ruimachalele.kommo.com` |
| `KOMMO_LONG_TOKEN` | Bearer token de larga duración para autenticar todas las llamadas |
| `KOMMO_ID` | ID de integración (disponible, reservado para OAuth futuro) |
| `KOMMO_SECRET_KEY` | Secret (disponible, reservado para OAuth futuro) |

Solo `KOMMO_BASE_URL` y `KOMMO_LONG_TOKEN` son usados en el MVP.

---

## Arquitectura

### Archivos

```
lib/services/
  kommo.ts            ← servicio Kommo (nueva)
  kommo.test.ts       ← tests unitarios del builder de payload (nueva)
  forms.ts            ← modificación menor: SubmitFormReport expone contactData + formSlug
app/api/forms/[slug]/submit/
  route.ts            ← modificación: llamar createKommoLead() tras submitForm() exitoso
```

### Flujo

```
POST /api/forms/[slug]/submit
  → route.ts: parse body, rate limit
  → submitForm(slug, values) → { ok: true, data: { submissionId, contactId, contactData, formSlug, successMessage } }
  → if (ok && KOMMO_BASE_URL && KOMMO_LONG_TOKEN):
      try { await createKommoLead(data) } catch { console.error(...) }  ← non-blocking
  → return 200 al usuario
```

---

## `lib/services/kommo.ts`

### Tipos

```ts
export type KommoConfig = {
  pipelineId: number
  statusId: number
  emailFieldId: number | null
  phoneFieldId: number | null
}

export type KommoLeadInput = {
  contactName: string | undefined
  email: string | undefined
  phone: string | undefined
  formSlug: string
  formName: string
}
```

### Cache en memoria

```ts
let configCache: KommoConfig | null = null
```

Variable de módulo. Se llena la primera vez que se necesita. Null = todavía no cargado.

### `getKommoConfig(): Promise<KommoConfig>`

Llama a dos endpoints de Kommo y cachea el resultado:

1. `GET {KOMMO_BASE_URL}/api/v4/pipelines` — tomar el primero de la lista
   - `pipelineId = pipelines[0].id`
   - `statusId = pipelines[0]._embedded.statuses[0].id` (el primer status del pipeline)

2. `GET {KOMMO_BASE_URL}/api/v4/contacts/custom_fields` — buscar campos email y teléfono
   - `emailFieldId`: campo donde `field_code === 'EMAIL'` o `field_type === 'EMAIL'`, o `null` si no existe
   - `phoneFieldId`: campo donde `field_code === 'PHONE'` o `field_type === 'PHONE'`, o `null` si no existe

Ambas llamadas usan `Authorization: Bearer {KOMMO_LONG_TOKEN}`.

Si alguna falla, la función lanza un error (el caller tiene el try/catch).

### `buildLeadPayload(input, config): object`

Función pura. Construye el array de un elemento para `POST /api/v4/leads`:

```ts
[{
  name: `Form: ${input.formName} — ${input.contactName ?? 'Sin nombre'}`,
  pipeline_id: config.pipelineId,
  status_id: config.statusId,
  _embedded: {
    contacts: [{
      name: input.contactName ?? 'Sin nombre',
      custom_fields_values: [
        // incluir solo si field_id y valor existen
        ...(config.emailFieldId && input.email
          ? [{ field_id: config.emailFieldId, values: [{ value: input.email, enum_code: 'WORK' }] }]
          : []),
        ...(config.phoneFieldId && input.phone
          ? [{ field_id: config.phoneFieldId, values: [{ value: input.phone, enum_code: 'WORK' }] }]
          : []),
      ],
    }],
    tags: [{ name: input.formSlug }],
  },
}]
```

### `createKommoLead(input: KommoLeadInput): Promise<void>`

1. Lee `KOMMO_BASE_URL` y `KOMMO_LONG_TOKEN` de `process.env`. Si alguno falta, retorna sin hacer nada.
2. Llama `getKommoConfig()` (usa cache si existe).
3. Llama `buildLeadPayload(input, config)`.
4. `POST {KOMMO_BASE_URL}/api/v4/leads` con header `Authorization: Bearer {KOMMO_LONG_TOKEN}` y `Content-Type: application/json`.
5. Si `response.ok === false`, lanza `new Error(`Kommo API ${response.status}`)`.

---

## Modificación a `lib/services/forms.ts`

Extender `SubmitFormReport` para exponer los datos de contacto que ya se computan dentro de la función:

```ts
export type SubmitFormReport = {
  submissionId: number
  contactId: number | null
  contactCreated: boolean
  successMessage: string
  // Nuevos campos:
  contactData: { name?: string; email?: string; phone?: string }
  formSlug: string
  formName: string
}
```

El objeto `contactData` ya existe como variable local en `submitForm()` — simplemente se devuelve. `formSlug` y `formName` vienen de `form.slug` y `form.name` que ya se obtienen de la query inicial.

---

## Modificación a `app/api/forms/[slug]/submit/route.ts`

Después de la línea `const result = await submitForm(...)`:

```ts
if (result.ok) {
  void createKommoLead({
    contactName: result.data.contactData.name,
    email: result.data.contactData.email,
    phone: result.data.contactData.phone,
    formSlug: result.data.formSlug,
    formName: result.data.formName,
  }).catch((err: unknown) => console.error('[Kommo] createKommoLead failed:', err))
}
```

Usar `void` + `.catch()` — no `await` — para no bloquear la respuesta al usuario.

---

## Tests

`lib/services/kommo.test.ts` — tests unitarios sobre `buildLeadPayload`:

1. Incluye email y teléfono cuando ambos field_id y valores existen
2. Omite email si `emailFieldId === null`
3. Omite teléfono si `phone` es undefined
4. Usa "Sin nombre" cuando `contactName` es undefined
5. Pone el formSlug como tag
6. El nombre del lead sigue el patrón `Form: [formName] — [contactName]`

No se testea la lógica de red (fetch / cache) — eso es integration territory.

---

## Criterios de aceptación

- Cuando un formulario publicado recibe un submit válido, se crea un lead en Kommo con nombre, email, teléfono y el slug como tag
- Si Kommo no está configurado (`KOMMO_BASE_URL` o `KOMMO_LONG_TOKEN` ausentes), el submit funciona normalmente sin ningún error
- Si la llamada a Kommo falla por cualquier razón (red, API error, timeout), el usuario recibe su respuesta `200 ok` sin cambios
- El pipeline y los field IDs se obtienen dinámicamente en la primera llamada y se cachean en memoria para las siguientes
- `buildLeadPayload` tiene tests unitarios que cubren los casos de campos opcionales ausentes
