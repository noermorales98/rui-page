# STYLE_GUIDE — CRM Rui

> Tailwind v4 + tokens via `@theme inline` en `app/globals.css`. Sin librería UI externa. Componentes propios en `app/crm/_components/ui/`. Utilidades de clase en `app/crm/_lib/ui-tokens.ts`.

## 1. Tokens (en `app/globals.css`)

Paleta **Material Design 3 — light warm**. No inventar colores nuevos; usar siempre estas variables.

```css
@theme inline {
  /* Fondos / superficies */
  --color-background:                #fef9f1;   /* fondo de página */
  --color-surface:                   #fef9f1;
  --color-surface-container-lowest:  #ffffff;   /* inputs, modales */
  --color-surface-container-low:     #f8f3eb;   /* inputs en formularios */
  --color-surface-container:         #f2ede5;   /* cards/paneles base */
  --color-surface-container-high:    #ece8e0;   /* hover de cards, botón cerrar */
  --color-surface-container-highest: #e7e2da;   /* hover alto */
  --color-surface-bright:            #fef9f1;
  --color-surface-dim:               #ded9d2;
  --color-surface-variant:           #e7e2da;
  --color-inverse-surface:           #32302b;
  --color-inverse-on-surface:        #f5f0e8;

  /* Texto */
  --color-on-background:             #1d1c17;
  --color-on-surface:                #1d1c17;   /* texto principal */
  --color-on-surface-variant:        #484550;   /* texto secundario / muted */

  /* Bordes / contornos */
  --color-outline:                   #797581;   /* borde focus activo */
  --color-outline-variant:           #c9c4d1;   /* bordes de inputs y cards */

  /* Primario (índigo oscuro) */
  --color-primary:                   #251857;
  --color-on-primary:                #ffffff;
  --color-primary-container:         #3b2f6e;
  --color-on-primary-container:      #a699e0;
  --color-primary-fixed:             #e6deff;   /* focus ring */
  --color-primary-fixed-dim:         #cbbeff;
  --color-on-primary-fixed:          #1d0e4f;
  --color-on-primary-fixed-variant:  #493d7d;
  --color-inverse-primary:           #cbbeff;
  --color-surface-tint:              #615596;

  /* Secundario / accent (ámbar dorado) */
  --color-secondary:                 #7d5700;
  --color-on-secondary:              #ffffff;
  --color-secondary-container:       #fdc664;   /* botón accent, badges lime */
  --color-on-secondary-container:    #755100;
  --color-secondary-fixed:           #ffdeab;
  --color-secondary-fixed-dim:       #f4be5d;
  --color-on-secondary-fixed:        #271900;
  --color-on-secondary-fixed-variant:#5f4100;

  /* Terciario (verde oscuro) */
  --color-tertiary:                  #002a19;
  --color-on-tertiary:               #ffffff;
  --color-tertiary-container:        #0c422c;
  --color-on-tertiary-container:     #7bae92;
  --color-tertiary-fixed:            #b9efcf;
  --color-tertiary-fixed-dim:        #9dd2b4;
  --color-on-tertiary-fixed:         #002113;
  --color-on-tertiary-fixed-variant: #1d5038;

  /* Error */
  --color-error:                     #ba1a1a;
  --color-on-error:                  #ffffff;
  --color-error-container:           #ffdad6;
  --color-on-error-container:        #93000a;

  /* Acento especial */
  --color-accent-neon:               #dfff00;   /* dot notificación, avatar bg */

  /* Tipografía */
  --font-sans:    var(--font-inter), sans-serif;
  --font-serif:   var(--font-playfair-display), serif;
  --font-headline:var(--font-newsreader), serif;
  --font-mono:    ui-monospace, monospace;
}
```

## 2. Tipografía

- Display: `text-3xl font-semibold tracking-tight`.
- H1 página: `text-2xl font-semibold tracking-[-0.04em]`.
- H2 sección: `text-lg font-semibold`.
- Body: `text-sm` por defecto en app autenticada.
- Muted: `text-[var(--color-on-surface-variant)]`.
- Labels uppercase: `text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]`.

## 3. Layout app autenticada

- Sidebar fija izquierda (~240px) + área de contenido fluida con scroll de ventana.
- Contenedor de página: `mx-auto w-full max-w-7xl px-6 py-6`.
- Espaciado entre secciones: `space-y-6`.
- **Un solo scroll**: en la ventana completa, nunca en elementos pequeños.

## 4. Componentes base

Ubicación real: `app/crm/_components/ui/`

| Componente | Estado |
|---|---|
| `Button` | ✅ variantes: primary, secondary, accent, ghost, danger |
| `Input` | ✅ pill-shaped, focus visible |
| `Card` | ✅ usa TOK.panel |
| `Badge` | ✅ variantes: lime, blue, gray, amber, red |
| `StatusBadge` | ✅ ContactStatusBadge, SaleStatusBadge, etc. |
| `MetricCard` | ✅ |
| `IconCircle` | ✅ |
| `ModalWrapper` | ✅ modal genérico overlay |
| `Dialog` | componente de confirmación centrado (reemplaza confirm/alert) |
| `Toast` | mensajes rápidos esquina (reemplaza alert de error) |
| `Tabs` | agrupación de secciones |
| `Accordion` | secciones colapsables |
| `EmptyState` | estado vacío con instrucción |
| `Select` | select estilizado |
| `Textarea` | textarea estilizada |

Utilidades de clase consolidadas: `app/crm/_lib/ui-tokens.ts` (`TOK.*`).

## 5. Diseño visual — reglas

### Bordes y superficies
- **Sin bordes de color** en cards, paneles, tablas. Separar con fondo diferente.
- Jerarquía de fondo: `--color-background` → `--color-surface-container` → `--color-surface-container-lowest`.
- `border-radius`: `rounded-full` para inputs/botones, `rounded-[28px]` para cards/paneles.
- Sombras: solo muy sutiles si hacen falta. Preferir contraste de fondo.

### Estilo general
- Flat: sin gradientes decorativos, sin texturas.
- Minimalista: menos líneas divisorias, más espacio en blanco.
- Moderno: jerarquía por tamaño y peso, no por colores chillones.

### Scroll
- **Un solo scroll**: el de la ventana. Nada de scroll interno en cards o paneles pequeños.
- Excepción: tablas muy anchas (`overflow-x-auto`), modales largos (`overflow-y-auto` dentro del dialog).

## 6. Estados de status (badges)

| Estado | Variante badge |
|---|---|
| NEW / DRAFT / CANCELED / ARCHIVED | gray |
| QUALIFIED / DEMO / SENDING | blue |
| NEGOTIATION / PENDING / REFUNDED | amber |
| CLIENT / ENROLLED / PAID / SENT / PUBLISHED | lime |
| FAILED | red |

## 7. Patrones por pantalla

| Pantalla | Patrón |
|---|---|
| Dashboard | Compacto |
| Contactos (lista) | Tabla + Cards toggle, filtros acordeón |
| Contacto detalle | Acordeón para notas/deals/actividad |
| Contacto nuevo/editar | Formulario simple |
| Pipeline (kanban) | Sin cambio estructural |
| Pipeline deal detalle | Acordeón |
| Ventas | Tabla + Cards toggle |
| Webinars (lista) | Tabla + Cards toggle |
| Webinar detalle | Tabs (Info / Participantes / Zoom) |
| Formularios (lista) | Tabla + Cards toggle |
| Formulario builder | Tabs (Campos / Vista previa / Config) |
| Formulario respuestas | Tabla simple |
| Campañas (lista) | Tabla + Cards toggle |
| Campaña nueva | Tabs (Mensaje / Audiencia) |
| Config usuarios | Tabla simple |
| Config etiquetas | Tabla inline |
| Config integraciones | Cards de estado |

## 8. Sin alerts del navegador

- `alert()` → `Toast` (esquina, auto-desaparece).
- `confirm()` → `Dialog` centrado con título, descripción, botón primario y secundario.
- `prompt()` → campo de texto dentro de `Dialog`.
- Cero APIs nativas del navegador para UI.

## 9. Accesibilidad

- Contraste mínimo AA en todos los componentes.
- Focus visible siempre (`focus-visible:outline-2 focus-visible:outline-[var(--color-primary-fixed)]`).
- Labels asociadas a inputs (`<label htmlFor>`).
- Roles ARIA en componentes interactivos custom.

## 10. Reglas duras

- Cero `style={}` salvo valor dinámico calculado (ej. color de etiqueta elegido por usuario).
- No usar colores arbitrarios: siempre tokens `var(--color-*)`.
- No instalar shadcn, Radix ni MUI.
- Animaciones: solo `transition-*` de Tailwind.
- Toggle tabla/cards: estado en `?view=cards` (searchParam), no localStorage.
