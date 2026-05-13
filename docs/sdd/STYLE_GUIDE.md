# STYLE_GUIDE — CRM Rui

> Tailwind v4 + tokens via `@theme`. Sin librería UI externa. Componentes propios en `components/ui/`.

## 1. Tokens (en `app/globals.css` con `@theme`)

```css
@theme {
  /* Colores base */
  --color-bg: #0b0d12;
  --color-surface: #14171f;
  --color-surface-2: #1c2030;
  --color-border: #262b3a;
  --color-muted: #8b93a7;
  --color-text: #e7ebf3;
  --color-text-dim: #aeb6c8;

  /* Marca / acción */
  --color-primary: #6366f1;
  --color-primary-hover: #4f52e5;
  --color-primary-fg: #ffffff;

  /* Semánticos */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #38bdf8;

  /* Radios */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.25);
  --shadow-md: 0 4px 14px rgba(0,0,0,.30);

  /* Tipografía */
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}
```

## 2. Tipografía
- Display: `text-3xl font-semibold tracking-tight`.
- H1 página: `text-2xl font-semibold`.
- H2 sección: `text-lg font-medium`.
- Body: `text-sm` por defecto en app, `text-base` en páginas públicas.
- Muted: `text-[var(--color-text-dim)]`.

## 3. Layout app autenticada
- Sidebar fija izquierda (~240px), header sticky, contenido fluido.
- Contenedor de página: `mx-auto w-full max-w-7xl px-6 py-6`.
- Espaciado entre secciones: `space-y-6`.
- Cards: `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5`.

## 4. Componentes base (en `components/ui/`)
Mínimo MVP:
- `Button` (variantes: primary, secondary, ghost, danger; tamaños sm/md/lg).
- `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`.
- `Badge` (status colors).
- `Avatar`.
- `Dialog` / `Drawer`.
- `Tabs`.
- `Table` (sortable, paginable).
- `DataGrid` para tablas grandes.
- `EmptyState`.
- `Toast` (sonner-like simple, sin dependencia).
- `Tooltip`.
- `KanbanBoard` (envuelve `@dnd-kit`).
- `FormBuilderCanvas`, `FormBuilderField` (lógica condicional UI).
- `RichTextEditor` (campañas email).

## 5. Estados de status (badges)
- NEW / LEAD / DRAFT / PENDING → gris.
- QUALIFIED / DEMO / SENDING → azul.
- NEGOTIATION → ámbar.
- CLIENT / ENROLLED / PAID / SENT / PUBLISHED → verde.
- REFUNDED / CANCELED / FAILED / ARCHIVED → rojo o gris.

## 6. Accesibilidad
- Contraste mínimo AA en todos los componentes.
- Focus visible siempre (`focus-visible:outline-2 outline-[var(--color-primary)]`).
- Labels asociadas a inputs.
- Roles ARIA en componentes interactivos custom (Kanban, builder).

## 7. Reglas
- Cero `style={}` salvo cuando se necesite valor dinámico calculado.
- No usar colores arbitrarios; siempre tokens.
- No instalar shadcn ni Radix; lo necesario se implementa en `components/ui/`.
- Animaciones: solo `transition-*` de Tailwind, sin Framer Motion en MVP.
