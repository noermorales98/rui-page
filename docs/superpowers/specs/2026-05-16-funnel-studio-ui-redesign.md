# FunnelStudio UI Redesign

## Goal

Rediseñar la interfaz del FunnelStudio para eliminar el scroll excesivo, hacer el builder visible de inmediato, añadir gestión visual de páginas con flujo interconectado, reemplazar el editor de flujo basado en JSON por una UI visual para no-técnicos, y ocultar las opciones avanzadas del flujo principal.

---

## 1. Layout — Barra Superior Compacta

**Antes:** Header grande con breadcrumb, h1, slug, webinar info, badge de status → causa scroll antes de llegar al builder.

**Después:** Una sola barra compacta (`<header>`) con:
- Flecha ← de regreso a `/crm/landings`
- Nombre del funnel (truncado si es largo) + badge de status (Publicado/Borrador)
- Iconos a la derecha (HugeIcons):
  - `EyeIcon` → ver página pública en nueva pestaña
  - `Settings01Icon` → abre un drawer/panel lateral con configuración avanzada (slug, webinar link, descripción)

**Tabs visibles:** Páginas · Contenido · Tema · Flujo

El tab "HTML" desaparece de la barra de tabs. Las opciones de modo HTML por página quedan accesibles desde el drawer de configuración avanzada (`Settings01Icon`).

---

## 2. Tab "Páginas" — Flujo Horizontal Visual

**Visualización:** Nodos en fila horizontal conectados con flechas `→`. Cada nodo es una tarjeta con:
- Ícono HugeIcon según tipo de página:
  - `REGISTRATION` → `UserAdd01Icon`
  - `THANK_YOU` → `CheckmarkCircle01Icon`
  - `ACCESS` → `LockIcon`
  - `ROOM` → `VideoIcon`
- Nombre de la página (title)
- URL path (`/slug`)
- Tres botones inline:
  - `Edit02Icon` → navega al tab Contenido con esa página seleccionada (para páginas en modo VISUAL); para páginas en modo HTML abre el drawer de config avanzada de esa página
  - `EyeIcon` → abre `/f/[funnelSlug]/[pageSlug]` en nueva pestaña
  - `Delete02Icon` → muestra confirmación antes de eliminar (server action)

**Agregar página:** botón `+` al final del flujo (con `PlusSignIcon`) que muestra un dropdown con los tipos de página (`FunnelPageKind`) que aún no existen en ese funnel. Si los 4 tipos ya existen, el botón se oculta.

**Server actions nuevas:**
- `addFunnelPageAction(funnelId: number, kind: FunnelPageKind): Promise<{ error?: string }>`
  - Crea `FunnelPage` con title/key/slug por defecto según kind, position = último
- `deleteFunnelPageAction(pageId: number): Promise<{ error?: string }>`
  - Elimina la página (no se permite eliminar si es la única del funnel)

**Títulos/claves por defecto al crear:**
| Kind | Title | Key | Slug |
|------|-------|-----|------|
| REGISTRATION | Registro | registration | registro |
| THANK_YOU | Gracias | thank-you | gracias |
| ACCESS | Acceso | access | acceso |
| ROOM | Sala | room | sala |

---

## 3. Tab "Flujo" — Editor Visual de Automatización

Reemplaza el textarea JSON de `FunnelFlowEditor` por una UI visual de pasos lineales.

**Estructura:**

```
[Trigger] ⚡ Cuando alguien se registra
    |
[Paso 1] 📧 Enviar correo: "Bienvenida"  [editar] [eliminar]
    |
[Paso 2] ⏱ Esperar: 1 día               [editar] [eliminar]
    |
[+ Agregar paso]
```

**Trigger:** `<select>` con opciones:
- `registration_completed` → "Registro completado"
- `form_submitted` → "Formulario enviado"

**Tipos de paso y sus campos:**

| Tipo | Ícono | Campos |
|------|-------|--------|
| `email` | `Mail01Icon` | `subject: string`, `body: string` (textarea) |
| `wait` | `Clock01Icon` | `amount: number`, `unit: 'hours' \| 'days'` |
| `tag` | `Tag01Icon` | `tag: string` |
| `webhook` | `LinkSquare01Icon` | `url: string`, `method: 'POST' \| 'GET'` |

**Interacción:**
- Cada paso muestra ícono + resumen en una línea (ej. "Enviar correo: Bienvenida al webinar")
- Botón editar expande un form inline debajo del paso (no modal)
- Botón eliminar quita el paso inmediatamente de la lista
- "+ Agregar paso" abre un pequeño dropdown con los 4 tipos
- Botón "Guardar flujo" serializa trigger + steps a JSON y llama a `saveAutomationAction`

**Modelo de datos (sin cambios en DB):** Los pasos se serializan como JSON en el campo existente `Flow.steps` / `FlowStep.data`. El formato interno:

```json
{
  "trigger": "registration_completed",
  "steps": [
    { "id": "uuid", "type": "email", "subject": "Bienvenida", "body": "Hola..." },
    { "id": "uuid", "type": "wait", "amount": 1, "unit": "days" },
    { "id": "uuid", "type": "tag", "tag": "asistente" },
    { "id": "uuid", "type": "webhook", "url": "https://...", "method": "POST" }
  ]
}
```

---

## 4. Opciones Avanzadas Ocultas

Las siguientes opciones se mueven al drawer de `Settings01Icon` y desaparecen del flujo principal:
- Slug del funnel (editable)
- Webinar link/URL
- Descripción del funnel
- Modo HTML por página (toggle VISUAL/HTML dentro de la config de página)

El tab "HTML" desaparece completamente de la barra de tabs.

---

## Componentes Afectados

| Archivo | Cambio |
|---------|--------|
| `app/crm/landings/_components/FunnelStudio.tsx` | Reemplaza header grande por barra compacta; quita tab HTML; añade drawer de config avanzada |
| `app/crm/landings/_components/FunnelPagesTab.tsx` | Nuevo componente — flujo horizontal de páginas con acciones |
| `app/crm/landings/_components/FunnelFlowEditor.tsx` | Reemplaza textarea JSON por editor visual de pasos |
| `app/crm/landings/actions.ts` | Añade `addFunnelPageAction`, `deleteFunnelPageAction` |

---

## Fuera de Scope

- Drag-and-drop para reordenar páginas del funnel
- Ejecución real de las automatizaciones (solo UI de configuración)
- Condicionales o ramificaciones en el flujo (solo pasos lineales)
- Múltiples flujos por funnel
