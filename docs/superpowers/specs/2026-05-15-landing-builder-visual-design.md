# Landing Builder Visual — Diseño

**Fecha:** 2026-05-15  
**Estado:** Aprobado

## Objetivo

Reemplazar el editor de formularios actual (`FunnelContentEditor`) con un builder visual tipo Gutenberg: 3 columnas, canvas WYSIWYG, drag & drop con zonas de inserción.

---

## Arquitectura

### Layout: 3 columnas fijas

```
┌─────────────┬──────────────────────────┬──────────────────┐
│ BlockPalette│     BuilderCanvas        │   BlockEditor    │
│  (160px)    │   (flex: 1, WYSIWYG)     │    (240px)       │
│             │                          │                  │
│  ⬛ Hero    │  [bloque renderizado]    │  Propiedades     │
│  📝 Texto   │  ─── zona de drop ───    │  del bloque      │
│  🎥 Video   │  [bloque renderizado]    │  seleccionado    │
│  📋 Form    │  ─── zona de drop ───    │                  │
│  🔘 CTA     │  [bloque renderizado]    │                  │
│  ❓ FAQ     │                          │                  │
│  ⭐ Test.   │                          │                  │
│  🔗 Footer  │                          │                  │
│  ⌨️ HTML    │                          │                  │
└─────────────┴──────────────────────────┴──────────────────┘
```

### Componentes

| Componente | Ruta | Responsabilidad |
|---|---|---|
| `LandingBuilder` | `_components/LandingBuilder.tsx` | Raíz cliente. Estado global. Orquesta los 3 paneles. |
| `BlockPalette` | `_components/builder/BlockPalette.tsx` | Lista de tipos draggables. |
| `BuilderCanvas` | `_components/builder/BuilderCanvas.tsx` | Sortable container. WYSIWYG + overlays de selección. |
| `BlockEditor` | `_components/builder/BlockEditor.tsx` | Panel derecho. Carga editor por tipo. |
| `HeroEditor` | `_components/builder/editors/HeroEditor.tsx` | Campos del bloque HERO. |
| `TextEditor` | `_components/builder/editors/TextEditor.tsx` | Campos del bloque TEXT. |
| `VideoEditor` | `_components/builder/editors/VideoEditor.tsx` | Campos del bloque VIDEO. |
| `FormEditor` | `_components/builder/editors/FormEditor.tsx` | Solo título; form se inyecta automáticamente. |
| `CtaEditor` | `_components/builder/editors/CtaEditor.tsx` | Campos del bloque CTA. |
| `FaqEditor` | `_components/builder/editors/FaqEditor.tsx` | Lista editable de preguntas/respuestas. |
| `TestimonialsEditor` | `_components/builder/editors/TestimonialsEditor.tsx` | Lista editable de testimonios. |
| `FooterEditor` | `_components/builder/editors/FooterEditor.tsx` | Texto + lista de links. |
| `CustomHtmlEditor` | `_components/builder/editors/CustomHtmlEditor.tsx` | Textarea HTML + CSS monospace. |

`FunnelStudio.tsx` sustituye `<FunnelContentEditor>` por `<LandingBuilder>` en la pestaña `contenido`. Las pestañas HTML, Tema, Flujo y Publicación no cambian.

---

## Estado del builder

```ts
// En LandingBuilder (useState)
type BuilderState = {
  blocks: FunnelBlock[]     // orden = posición en canvas
  selectedId: string | null // bloque activo en panel derecho
  isDirty: boolean          // hay cambios sin guardar
}
```

`FunnelBlock` es el tipo existente de `lib/funnels/types.ts` — no se modifica el schema ni el servidor.

---

## Drag & Drop

**Librería:** `@dnd-kit/core` (ya instalada) + `@dnd-kit/sortable` (nueva dependencia).

### Paleta → Canvas (insertar bloque)

1. Cada item de `BlockPalette` es un `<Draggable>` con `id = type` (ej. `"HERO"`).
2. Al iniciar el drag, `DragOverlay` muestra una copia del item.
3. El canvas (`<SortableContext>`) muestra zonas de inserción (`<DropZone>`) entre cada bloque.
4. `onDragEnd`: se inserta un nuevo `FunnelBlock` con `defaultConfig[type]` en la posición indicada. El nuevo bloque queda `selectedId`.

### Canvas → Canvas (reordenar)

1. Cada bloque renderizado tiene un handle `⠿` que activa el drag.
2. `@dnd-kit/sortable` anima el reordenamiento.
3. `onDragEnd`: `arrayMove(blocks, oldIndex, newIndex)` — `isDirty = true`.

---

## Canvas WYSIWYG

`BuilderCanvas` itera `blocks` y por cada bloque:

1. Llama `renderFunnelBlocks({ blocks: [block], theme })` con un array de un solo bloque para obtener el React element real de ese bloque. Esto reutiliza el motor de render existente sin duplicar lógica.
2. Envuelve el element en `<SortableBlockWrapper>` que añade:
   - Border de selección (`border: 2px solid accent`) cuando `block.id === selectedId`.
   - Barra de controles superior: label del tipo, handle `⠿`, botón eliminar `🗑️`.
3. Al hacer clic en el wrapper → `setSelectedId(block.id)`.

El tema (`FunnelTheme`) se pasa desde `LandingBuilder` al canvas para que el render use los colores reales.

---

## Panel derecho — BlockEditor

`BlockEditor` recibe `{ block, theme, onUpdate, onDelete }` y renderiza el editor por tipo:

```ts
function BlockEditor({ block, onUpdate, onDelete }) {
  const update = (patch: Partial<typeof block.config>) =>
    onUpdate(block.id, { ...block.config, ...patch })

  switch (block.type) {
    case 'HERO':         return <HeroEditor config={block.config} onChange={update} />
    case 'TEXT':         return <TextEditor config={block.config} onChange={update} />
    case 'VIDEO':        return <VideoEditor config={block.config} onChange={update} />
    case 'FORM':         return <FormEditor config={block.config} onChange={update} />
    case 'CTA':          return <CtaEditor config={block.config} onChange={update} />
    case 'FAQ':          return <FaqEditor config={block.config} onChange={update} />
    case 'TESTIMONIALS': return <TestimonialsEditor config={block.config} onChange={update} />
    case 'FOOTER':       return <FooterEditor config={block.config} onChange={update} />
    case 'CUSTOM_HTML':  return <CustomHtmlEditor config={block.config} onChange={update} />
  }
}
```

Cada editor llama `onChange(patch)` en cada keystroke → el canvas re-renderiza en tiempo real.

### Campos por tipo

| Tipo | Campos requeridos | Campos opcionales |
|---|---|---|
| HERO | `title` | `eyebrow`, `subtitle`, `ctaText`, `ctaHref` |
| TEXT | `body` | `heading`, `align` (left/center) |
| VIDEO | `url` (youtube/vimeo/.mp4/.webm) | `caption`, `aspect` (16/9 · 4/3) |
| FORM | — | `title` |
| CTA | `buttonText`, `buttonHref` | `heading`, `body`, `variant` (primary/outline) |
| FAQ | — | `heading`, `items[]` (question + answer) |
| TESTIMONIALS | — | `heading`, `items[]` (name + text + role) |
| FOOTER | — | `text`, `links[]` (label + href) |
| CUSTOM_HTML | `html` (no vacío) | `css` |

---

## Guardado

Reutiliza el server action `saveBlocksAction` existente en `app/crm/landings/actions.ts`.

- Botón "Guardar" sticky en la barra superior del canvas.
- Atajo `Cmd/Ctrl+S` (event listener en `LandingBuilder`).
- Badge "● sin guardar" visible cuando `isDirty = true`.
- Sin auto-save — el usuario controla cuándo guarda.
- Antes de guardar: validación cliente (campos requeridos). Si hay errores, se marcan los bloques inválidos con borde rojo y se bloquea el guardado.

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `Delete` / `Backspace` | Elimina bloque seleccionado (si el foco no está en un input) |
| `Escape` | Deselecciona bloque |
| `Cmd/Ctrl+S` | Guarda |

---

## Validaciones por tipo

| Tipo | Regla |
|---|---|
| HERO | `title` no vacío |
| VIDEO | `url` debe coincidir con `youtube.com`, `vimeo.com`, `.mp4`, `.webm` |
| CTA | `buttonText` y `buttonHref` no vacíos |
| CUSTOM_HTML | `html` no vacío |
| CUSTOM_HTML | HTML y CSS sanitizados en servidor (ya implementado en `lib/funnels/sanitize.ts`) |

Bloques inválidos se muestran con borde rojo en el canvas. El guardado no procede hasta que todos los bloques sean válidos.

---

## Dependencias nuevas

- `@dnd-kit/sortable` — reordenamiento dentro del canvas y zonas de inserción.

`@dnd-kit/core` y `@dnd-kit/utilities` ya están instalados.

---

## Fuera de scope

- Preview en iframe (demasiado complejo con auth del CRM)
- Auto-save
- Deshacer/rehacer (Cmd+Z)
- Preview móvil/responsive dentro del builder
- Añadir nuevos tipos de bloque (los 9 actuales son suficientes)
