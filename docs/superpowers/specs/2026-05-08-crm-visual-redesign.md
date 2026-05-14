# CRM Visual Redesign — Spec

**Fecha:** 2026-05-08  
**Scope:** Solo visual (Tailwind CSS + componentes UI). Cero cambios a lógica, rutas, actions, queries ni estructura de datos.  
**Estrategia:** Approach B — componentes UI compartidos reutilizables.

---

## 1. Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `bg-page` | `#edeef0` | Fondo de toda la app CRM |
| `bg-surface` | `#f7f8fa` | Cards, sidebar, navbar |
| `bg-white` | `#ffffff` | Filas de tabla, inputs, botones secundarios, iconos circulares |
| `text-primary` | `#080808` | Texto principal |
| `text-muted` | `#8a8a8a` | Labels, subtítulos, iconos inactivos |
| `accent-lime` | `#dfff00` | Acento principal: card destacada, badge "Nuevo/Pagado", punto notif, hover activo |
| `accent-blue` | `#9bbdf7` | Acento secundario: badge "Calificado/Contactado", rol de usuario |
| `border-soft` | `rgba(255,255,255,0.6)` | Borde de cards y paneles |
| `border-line` | `#e5e7eb` | Divisores internos |

---

## 2. Tipografía

- Familia: **Inter** (ya cargada vía `next/font/google` en `app/layout.tsx`)
- Títulos de página: `text-4xl font-semibold tracking-[-0.04em]`
- Subtítulos de card: `text-[15px] font-semibold tracking-[-0.02em]`
- Texto body: `text-sm` (13–14px)
- Labels de tabla/nav: `text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]`

---

## 3. Layout CRM (`app/crm/layout.tsx`)

```
┌──────────────┬──────────────────────────────────────────┐
│              │  NAVBAR (col 2, row 1)                   │
│  SIDEBAR     ├──────────────────────────────────────────┤
│  (col 1,     │                                          │
│   row 1+2)   │  MAIN CONTENT (col 2, row 2)             │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

- Grid: `grid grid-cols-[260px_1fr] grid-rows-[68px_1fr] gap-4 p-5 min-h-screen bg-[#edeef0]`
- Sidebar: `col-span-1 row-span-2`
- Navbar: `col-start-2 row-start-1`
- Main: `col-start-2 row-start-2`

El layout **no usa `position: fixed`** en la sidebar. Todos los elementos son parte del grid y se quedan dentro del padding de página.

---

## 4. Componentes UI compartidos

Ubicación: `app/crm/_components/ui/`

### 4.1 `Card`
```tsx
// Props: className?, children
// Clases base:
"bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6"
```

### 4.2 `Button`
```tsx
// variant: "primary" | "secondary" | "accent"
primary:   "bg-[#080808] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#222] transition text-sm"
secondary: "bg-white text-[#080808] rounded-full px-6 py-3 font-medium hover:bg-[#f2f2f2] transition text-sm shadow-sm"
accent:    "bg-[#dfff00] text-[#080808] rounded-full px-6 py-3 font-semibold hover:brightness-95 transition text-sm"
```

### 4.3 `Badge`
```tsx
// variant: "lime" | "blue" | "gray" | "amber"
base:  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
lime:  "bg-[#dfff00] text-[#080808]"
blue:  "bg-[#9bbdf7] text-[#080808]"
gray:  "bg-[#f0f1f3] text-[#8a8a8a]"
amber: "bg-amber-50 text-amber-700"
```

### 4.4 `Input` (reemplaza inputs sueltos)
```tsx
"w-full bg-white rounded-full px-5 py-3 text-sm outline-none border-2 border-transparent focus:border-[#dfff00] transition placeholder:text-[#aaa]"
```

### 4.5 `IconCircle`
```tsx
// size?: "sm" | "md" — wrapper circular para iconos de métricas
sm: "w-9 h-9 rounded-full bg-white flex items-center justify-center"
md: "w-11 h-11 rounded-full bg-white flex items-center justify-center"
```

### 4.6 `MetricCard`
```tsx
// Compone Card + IconCircle + valor grande + label
// accent?: boolean — si true usa bg-[#dfff00] en vez de bg-[#f7f8fa]
```

### 4.7 `StatusBadge`
```tsx
// Mapeo de status → variant de Badge
// Contactos: NEW→lime, QUALIFIED→blue, CLIENT→gray
// Ventas: PAID→lime, PENDING→amber, REFUNDED→amber, CANCELED→gray
// Pipeline: LEAD→gray, DEMO→blue, NEGOTIATION→amber, ENROLLED→lime
// Campañas: DRAFT→gray, SENT→lime, SENDING→blue, FAILED→gray
```

---

## 5. Sidebar (`app/crm/_components/Sidebar.tsx`)

- Fondo: `bg-[#f7f8fa] rounded-[28px] border border-white/60`
- Brand: texto `font-bold tracking-[-0.04em]` con borde inferior
- Nav items: `flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-[13.5px] font-medium text-[#8a8a8a]`
- Nav activo: `bg-white text-[#080808] font-semibold shadow-sm`
- Iconos: **Hugeicons** (`@hugeicons/core-free-icons` + `@hugeicons/react`), 16px, `strokeWidth={1.5}`
- Badges de conteo: `bg-[#9bbdf7] text-[#080808] rounded-full text-[10px] font-bold px-1.5`
- Sidebar **ya no incluye** el bloque de usuario
- Detección de ruta activa: `usePathname()` → componente Client

### Iconos por sección
| Sección | Icono Hugeicons |
|---|---|
| Dashboard | `DashboardSquare01Icon` |
| Contactos | `UserMultipleIcon` |
| Pipeline | `GitBranchIcon` |
| Webinars | `Video01Icon` |
| Formularios | `File01Icon` |
| Campañas | `Mail01Icon` |
| Cursos | `BookOpen01Icon` |
| Ventas | `ShoppingCart01Icon` |
| Configuración | `Settings01Icon` |
| Usuarios | `UserAccountIcon` |
| Cerrar sesión | `Logout01Icon` |

---

## 6. Navbar (`app/crm/_components/Navbar.tsx`) — componente nuevo

- Posición: col 2 / row 1 del grid (no fixed, no sticky)
- Fondo: `bg-[#f7f8fa] rounded-[28px] border border-white/60 h-[68px] px-6`
- **Izquierda**: título de la página actual (usando `usePathname()` → mapa a label)
- **Derecha** (de izquierda a derecha):
  1. Botón búsqueda: icono `Search01Icon` en círculo blanco 40px
  2. Botón notificaciones: icono `Notification02Icon` en círculo blanco 40px + punto `#dfff00` si hay notifs
  3. Divisor vertical 1px
  4. Bloque usuario: `nombre · badge-rol · avatar-lime` en píldora blanca
- El navbar es un **Server Component** que recibe la sesión via `auth()`.

---

## 7. Tablas → filas-card

Todas las tablas (`ContactsTable`, `SalesTable`, `WebinarTable`, `CampaignsTable`, `FormulariosTable`, `ParticipantsTable`) dejan de usar `<table>` y pasan a listas de `<div>`:

```
Card wrapper
  ├── Header row (labels)  → div grid con text-[10.5px] uppercase
  └── Data rows            → div grid, bg-white rounded-2xl px-4 py-3 mb-1.5
```

Los links y acciones dentro de cada fila se mantienen idénticos, solo cambia el markup visual.

---

## 8. Pipeline (`PipelineColumn`, `DealCard`)

> **Actualización:** las columnas y cards del pipeline usan variables de tema (`var(--color-*)`) y `TOK` donde aplica; ver código en `app/crm/pipeline/_components/`.

- Columnas con fondo `surface-container-high`, drop con borde `primary-fixed`, etapa ENROLLED con acentos `secondary-container`, cards en `surface-container-lowest`, etc.

---

## 9. Modales y formularios en página

Los modales de ventas, deals, webinars y formularios siguen el patrón overlay + panel (idealmente con `TOK.modalPanel`, `TOK.modalTitle`, `TOK.closeIconBtn`).

**Contactos:** ya no usan modales para crear/editar/importar; usan rutas dedicadas y `ContactForm` / `CsvImporter` (véase spec de contactos actualizado). Otros módulos (`CreateSaleModal`, `CreateDealModal`, …) mantienen modal.

---

## 10. Páginas individuales — ajustes de header

Cada page file (`contactos/page.tsx`, `ventas/page.tsx`, etc.) actualiza su header:
- `<h1>` → clase `text-4xl font-semibold tracking-[-0.04em]`
- Subtítulo count → `text-sm text-[#8a8a8a]`
- Botones de acción → componente `Button`

La tabla/contenido se envuelve en `<Card>` del sistema compartido.

---

## 11. Páginas de detalle (`contactos/[id]`, `webinars/[id]`)

Se aplican las mismas clases Card, Button, Badge. El ActivityFeed y ContactHeader reciben estilos actualizados pero sin cambiar lógica.

---

## 12. Dependencias nuevas

| Paquete | Versión instalada | Uso |
|---|---|---|
| `@hugeicons/react` | ^1.1.6 | Componente `HugeiconsIcon` |
| `@hugeicons/core-free-icons` | ^4.1.2 | Datos de iconos free |

Ambos ya instalados con `--legacy-peer-deps`.

---

## 13. Archivos a crear

| Archivo | Descripción |
|---|---|
| `app/crm/_components/ui/Card.tsx` | Wrapper card |
| `app/crm/_components/ui/Button.tsx` | Botón con variantes |
| `app/crm/_components/ui/Badge.tsx` | Badge con variantes |
| `app/crm/_components/ui/Input.tsx` | Input redondeado |
| `app/crm/_components/ui/IconCircle.tsx` | Círculo para iconos |
| `app/crm/_components/ui/MetricCard.tsx` | Card de métrica |
| `app/crm/_components/ui/StatusBadge.tsx` | Badge de estado por entidad |
| `app/crm/_components/ui/index.ts` | Re-exports |
| `app/crm/_components/Navbar.tsx` | Navbar nuevo |

---

## 14. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `app/crm/layout.tsx` | Grid layout + montar Navbar |
| `app/crm/_components/Sidebar.tsx` | Nueva estética + Hugeicons + activo via usePathname |
| `app/crm/_components/SignOutButton.tsx` | Usar Button secondary |
| `app/crm/contactos/page.tsx` | Header + Card wrapper |
| `app/crm/contactos/nuevo/page.tsx` · `app/crm/contactos/[id]/editar/page.tsx` · `app/crm/contactos/importar/page.tsx` | Rutas de formulario / import (reemplazan modales) |
| `app/crm/contactos/_components/ContactForm.tsx` · `app/crm/contactos/_components/CsvImporter.tsx` | Formulario e importación |
| `app/crm/contactos/_components/ContactsTable.tsx` | Table → card-rows |
| `app/crm/contactos/_components/ContactFilters.tsx` | Input + Button |
| `app/crm/contactos/[id]/page.tsx` | Layout + Card |
| `app/crm/contactos/[id]/_components/*.tsx` | Estilo en detalle |
| `app/crm/pipeline/page.tsx` | Header + Card wrapper |
| `app/crm/pipeline/_components/PipelineBoard.tsx` | DragOverlay ring |
| `app/crm/pipeline/_components/PipelineColumn.tsx` | Columna nueva estética |
| `app/crm/pipeline/_components/DealCard.tsx` | Card nueva estética |
| `app/crm/pipeline/_components/CreateDealModal.tsx` | Modal estilo nuevo |
| `app/crm/ventas/page.tsx` | Header + Card wrapper |
| `app/crm/ventas/_components/SalesTable.tsx` | Table → card-rows |
| `app/crm/ventas/_components/SalesFilters.tsx` | Input + Button |
| `app/crm/ventas/_components/CreateSaleModal.tsx` | Modal estilo nuevo |
| `app/crm/webinars/page.tsx` | Header |
| `app/crm/webinars/_components/WebinarTable.tsx` | Table → card-rows |
| `app/crm/webinars/_components/CreateWebinarModal.tsx` | Modal estilo nuevo |
| `app/crm/webinars/[id]/page.tsx` | Layout |
| `app/crm/webinars/[id]/_components/*.tsx` | Estilo |
| `app/crm/campanas/page.tsx` | Header + Card wrapper |
| `app/crm/campanas/_components/CampaignsTable.tsx` | Table → card-rows |
| `app/crm/campanas/new/page.tsx` | Estilo formulario |
| `app/crm/formularios/page.tsx` | Header + Card |
| `app/crm/formularios/_components/FormulariosTable.tsx` | Table → card-rows |
| `app/crm/formularios/_components/CreateFormModal.tsx` | Modal estilo nuevo |
| `app/crm/formularios/[id]/page.tsx` | Estilo FormBuilder |
| `app/crm/formularios/[id]/respuestas/page.tsx` | Estilo |
| `app/crm/configuracion/page.tsx` | Estilo |
| `app/crm/configuracion/usuarios/page.tsx` | Estilo |
| `app/crm/dashboard/page.tsx` | Placeholder estilo |
| `app/crm/cursos/page.tsx` | Estilo |
| `app/crm-login/page.tsx` | Estilo login |

---

## 15. Lo que NO cambia

- Toda lógica en `actions.ts`
- Queries de Prisma
- Rutas y navegación
- Schema de base de datos
- Funcionalidad de drag-and-drop del Pipeline
- Funcionalidad de filtros, paginación, búsqueda
- Auth y protección de rutas
- Tests existentes
