# Skill: module-forms

## Alcance
`/crm/formularios` (builder) + `/formularios/[slug]` (público) + `/embed/formularios/[slug]` (iframe) + endpoint submit.

## Pre-lectura
- `sdd-loader`, `zod-validator`, `role-guard`, `audit-logger`.

## Estructura
```
app/crm/formularios/
  page.tsx
  nuevo/page.tsx
  [id]/page.tsx                     # builder
  [id]/respuestas/page.tsx
  _components/
    FormsTable.tsx
    FormBuilder.tsx                 # cliente principal
    FieldPalette.tsx
    FieldCanvas.tsx
    FieldEditor.tsx
    ConditionalLogicEditor.tsx
    FormPreview.tsx
app/(public)/formularios/[slug]/page.tsx
app/(public)/embed/formularios/[slug]/page.tsx
app/api/forms/[slug]/submit/route.ts
lib/services/forms.ts
lib/validators/forms.ts
```

## Tipos de campo
Ver enum `CrmFormFieldType` en `DATA_MODEL.md`.

## Lógica condicional
- En `CrmFormField.config`:
  ```json
  { "showWhen": { "fieldKey": "tieneEmpresa", "op": "eq", "value": "si" } }
  ```
- Ops soportados: `eq`, `neq`, `in`, `notIn`, `empty`, `notEmpty`.
- Evaluación en cliente (render) y servidor (validación submit).
- Campo oculto por condición = no validar required.

## Server actions
Ver `API_SPEC.md §4.5`. Mínimo:
- CRUD forms, `addField`/`updateField`/`removeField`/`reorderFields`.
- `publishForm`, `archiveForm`.
- `submitForm` (interna desde route).

## Endpoint submit
`POST /api/forms/[slug]/submit`:
1. Rate limit por IP (max 10/min).
2. Buscar form `PUBLISHED`. Si no existe → 404.
3. Validar payload con schema generado dinámicamente desde fields.
4. Aplicar lógica condicional para required.
5. `prisma.$transaction`:
   - Crear `CrmFormSubmission` + valores.
   - Buscar Contact por `EMAIL` target. Si no existe, crear; si existe, actualizar campos.
   - Crear `ContactActivity` type `FORM_SUBMITTED`.
6. Responder JSON `{ ok:true }` o `{ ok:false, error }`.

## Embed
Misma página que pública, pero con `<meta name="x-embed" />` y CSS sin chrome.
Encabezado X-Frame-Options omitido para esa ruta (configurar en `next.config`).

## Dedupe
Email primario. Si formulario no captura email pero sí phone, dedupe por phone.

## Builder UI
- 3 columnas: paleta, canvas, editor del campo seleccionado.
- Drag desde paleta al canvas, reordenamiento dentro del canvas (dnd-kit).
- Cada campo: label, key (auto), required, helpText, placeholder, condicional.
- Preview en tiempo real (`FormPreview`).

## Testing
- Unit: condicional show/hide, required dinámico.
- E2E: crear form con 3 campos + condicional, publicar, enviar submission, ver en `/crm/contactos`.

## Done
- Form embebible en sitio externo sin errores CORS.
- Submission crea contacto correctamente.
