# Skill: landing-builder

## Cuándo usarla
Trabajo dentro del builder visual de landings.

## Pre-lectura
- `module-landings.md`
- `form-builder.md` (mismos principios DnD).
- `ui-component.md`, `rsc-patterns.md`.

## Arquitectura del builder
3 zonas (similar al form-builder):
1. **Paleta** (`BlockPalette`) — bloques disponibles, draggables.
2. **Canvas** (`LandingPreview`) — bloques ordenados, sortables, render WYSIWYG.
3. **Editor** (`LandingBlockEditor`) — props del bloque seleccionado.

## Estado cliente
```ts
type BuilderBlock = {
  tempId: string;
  id?: number;
  type: LandingBlockType;
  position: number;
  config: Record<string, unknown>;  // depende del tipo
  customHtml?: string;
  customCss?: string;
};
```

## Drag & drop
- Paleta → canvas: crear `BuilderBlock` con `config` default por tipo.
- Reordenamiento dentro de canvas (mismo patrón que `form-builder`).
- `onDragEnd` actualiza posiciones.

## Props default por tipo
```ts
export const defaultConfigByType: Record<LandingBlockType, object> = {
  HERO: { title:"Tu título", subtitle:"", ctaText:"", ctaHref:"" },
  VIDEO: { provider:"youtube", url:"", aspect:"16/9" },
  CTA: { heading:"", body:"", buttonText:"Quiero entrar", buttonHref:"", variant:"primary" },
  FORM_EMBED: { formId: null },
  TESTIMONIALS: { items: [] },
  FAQ: { items: [] },
  FOOTER: { text:"", links: [] },
  CUSTOM_HTML: {},  // usa customHtml + customCss
};
```

## Editor por tipo
Cada tipo tiene su mini-form de edición:
- `HeroEditor`, `VideoEditor`, `CtaEditor`, `FormEmbedEditor` (selector de CrmForm), `TestimonialsEditor` (lista editable), `FaqEditor`, `FooterEditor`, `CustomHtmlEditor` (textarea HTML + textarea CSS).

## CUSTOM_HTML
- Editor con dos áreas: HTML y CSS.
- Avisar al usuario: "Sanitizado al guardar; <script> no permitido".
- Preview live (sanitizar también en cliente para no engañar).

## Preview WYSIWYG
- Usa el mismo motor de render que la pública (compartido en `lib/landings/render.tsx`).
- Solo difiere en wrapper de selección/edición visible solo en builder.

## Guardar
- Botón "Guardar" → `saveBlocks(landingId, blocks)`:
  1. Validación Zod.
  2. Sanitizar `customHtml`/`customCss`.
  3. Diff con DB: insertar nuevos, actualizar existentes, eliminar removidos.
  4. Transacción.

## Atajos
- `Delete` borra bloque seleccionado.
- `Esc` deselecciona.
- `Ctrl/Cmd+S` guarda.

## Validaciones
- HERO: title obligatorio.
- VIDEO: url obligatoria y debe matchear `youtube.com|vimeo.com|.mp4|.webm`.
- CTA: buttonText y buttonHref obligatorios.
- FORM_EMBED: formId apunta a un CrmForm PUBLISHED del usuario.
- CUSTOM_HTML: html no vacío.

## Performance
- Render canvas con `memo` por bloque.
- Editor con `useDeferredValue` en textareas grandes.

## Done
- DnD fluido.
- Preview real.
- Sanitización antes de guardar.
- Validaciones por tipo.
