# Form Block Dinámico — Diseño

**Fecha:** 2026-05-15
**Estado:** Aprobado

## Objetivo

Reemplazar el formulario genérico hardcodeado del bloque FORM con un selector de `CrmForm` reales. El usuario elige qué formulario vincula a cada bloque FORM desde el panel derecho del builder, y el canvas muestra los campos reales en tiempo real.

---

## Arquitectura

### Config del bloque FORM

```ts
// Antes
{ title?: string, submitLabel?: string }

// Después
{ title?: string, formId: number | null, formSlug: string | null }
```

`title` es un override opcional del encabezado. Si está vacío, se usa `form.name`.
`formId` y `formSlug` identifican el `CrmForm` vinculado.

### Flujo en el builder (client-side)

```
FormEditor (monta)
  → llama listPublishedFormsAction()
  → muestra <select> con CrmForms publicados

Usuario elige formulario
  → onUpdate guarda { formId, formSlug } en block.config
  → LandingBuilder detecta cambio de formId
  → llama getFormDetailAction(formId)
  → guarda en formsCache: Record<number, FormDetail>

BuilderCanvas recibe formsCache
  → renderFunnelBlocks({ blocks, theme, formsCache })
  → bloque FORM renderiza campos reales (preview visual, sin submit funcional)
```

### Flujo en la landing pública (server-side)

```
Page component (server)
  → lee blocks de BD
  → extrae todos los formId de bloques FORM
  → query getForm(id) por cada formId único
  → construye formsCache: Record<number, FormDetail>
  → renderFunnelBlocks({ blocks, theme, formsCache })
  → bloque FORM renderiza FormRenderer con campos reales + server action de submit
```

---

## Componentes y archivos

| Archivo | Cambio |
|---|---|
| `lib/funnels/defaults.ts` | Actualizar default FORM: `{ title: '', formId: null, formSlug: null }` |
| `lib/funnels/render.ts` | Aceptar `formsCache` opcional; renderizar campos reales en bloque FORM |
| `lib/funnels/types.ts` | Añadir tipo `FormCacheEntry` si es necesario |
| `app/crm/landings/actions.ts` | Añadir `listPublishedFormsAction()` y `getFormDetailAction(id)` |
| `builder/editors/FormEditor.tsx` | Selector de formulario + campo title override |
| `LandingBuilder.tsx` | Estado `formsCache`, fetch al cambiar formId |
| `builder/BuilderCanvas.tsx` | Pasar `formsCache` a `renderFunnelBlocks` |
| Landing page pública | Fetch forms server-side, pasar a renderer |

La landing page pública está en `app/(public)/[slug]/page.tsx` o similar — confirmar ruta al implementar.

---

## FormEditor — UI

**Campos:**

| Campo | Tipo | Nota |
|---|---|---|
| Formulario | `<select>` | Lista de CrmForms publicados. Requerido. |
| Título | `<input>` | Override opcional. Si vacío → usa `form.name`. |

**Estados del select:**
- Cargando: deshabilitado, texto "Cargando formularios…"
- Sin formularios publicados: mensaje "No tienes formularios publicados. Crea uno en /crm/formularios."
- Normal: opción vacía "— Selecciona un formulario —" + lista de `name (N campos)`

---

## Canvas WYSIWYG

**Sin formId:** placeholder `"Selecciona un formulario en el panel derecho"` centrado en el espacio del bloque, con borde punteado.

**Con formId y formData en cache:** renderiza los campos del formulario tal cual se verán en la landing (labels, inputs, placeholders). El botón de submit se muestra pero deshabilitado (atributo `disabled` o `pointer-events: none`) — deja claro que es solo preview.

**Con formId pero aún cargando:** spinner o skeleton en el espacio del bloque.

---

## Validación al guardar

El bloque FORM sin `formId` es inválido — borde rojo en el canvas y el guardado se bloquea, igual que otros bloques con campos requeridos.

Regla añadida en `lib/funnels/builder-validation.ts`:
```ts
if (block.type === 'FORM' && !cfg.formId)
  errors.push({ blockId: block.id, message: 'Debes seleccionar un formulario' })
```

---

## Server actions nuevas

### `listPublishedFormsAction()`

```ts
// Devuelve
{ id: number; name: string; slug: string; fieldCount: number }[]
```

Llama `listForms()` del servicio existente, filtra `status === 'PUBLISHED'` y `deletedAt === null`.

### `getFormDetailAction(formId: number)`

```ts
// Devuelve
{
  id: number
  name: string
  slug: string
  submitLabel: string
  successMessage: string
  fields: { id: number; label: string; fieldKey: string; type: string; placeholder: string | null; isRequired: boolean; position: number; config: unknown }[]
} | null
```

Llama `getForm(formId)` del servicio existente.

---

## `renderFunnelBlocks` — cambio de firma

```ts
// Antes
function renderFunnelBlocks(opts: {
  blocks: FunnelBlock[]
  theme: FunnelTheme
  registerForm?: React.ReactNode
}): React.ReactNode[]

// Después
function renderFunnelBlocks(opts: {
  blocks: FunnelBlock[]
  theme: FunnelTheme
  formsCache?: Record<number, FormCacheEntry>
  registerForm?: React.ReactNode  // fallback retrocompatible
}): React.ReactNode[]
```

`registerForm` se mantiene para no romper otros usos existentes. Si hay `formsCache` y el bloque tiene `formId`, se usa `formsCache[formId]` — `registerForm` se ignora para ese bloque.

---

## Renderizado público del bloque FORM

```tsx
case 'FORM': {
  const formEntry = formsCache?.[cfg.formId as number]
  const title = (cfg.title as string) || formEntry?.name || 'Reserva tu lugar'

  return (
    <section id="registro" style={sectionStyle}>
      <div style={containerStyle}>
        <h2>{title}</h2>
        {formEntry
          ? <FormRenderer
              title=""
              description={null}
              fields={formEntry.fields}
              submitLabel={formEntry.submitLabel}
              successMessage={formEntry.successMessage}
              action={submitFormAction.bind(null, formEntry.slug)}
            />
          : registerForm ?? <p>Formulario no disponible.</p>
        }
      </div>
    </section>
  )
}
```

---

## Fuera de scope

- Crear formularios desde el builder
- Editar campos del formulario desde el builder
- Múltiples pasos / lógica condicional
- Preview de submit funcional en el builder
