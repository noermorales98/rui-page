# Skill: ui-component

## Cuándo usarla
Crear o modificar un componente base en `components/ui/`.

## Pre-lectura
- `docs/sdd/STYLE_GUIDE.md` (tokens + reglas).
- `docs/sdd/CODE_RULES.md`.

## Reglas duras
- Solo tokens definidos en `@theme` (ver `STYLE_GUIDE.md §1`).
- Cero colores arbitrarios (`bg-red-500` etc). Siempre `bg-[var(--color-danger)]` o utilidad mapeada.
- Cero `style={}` salvo valor dinámico calculado.
- Sin librerías UI externas (no shadcn, no Radix, no MUI).
- TypeScript estricto. Props con interface explícita.
- `forwardRef` cuando el componente necesite ref (inputs, botones).
- Accesibilidad obligatoria: labels, ARIA, focus visible.

## Patrón base
```tsx
// components/ui/Button.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary:   "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)]",
  secondary: "bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]",
  ghost:     "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
  danger:    "bg-[var(--color-danger)] text-white hover:opacity-90",
};

const sizeCls: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant="primary", size="md", loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium",
        "transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...rest}
    >
      {loading ? "..." : children}
    </button>
  ),
);
Button.displayName = "Button";
```

## Helper `cn`
```ts
// lib/utils/cn.ts
export function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}
```

## Checklist por componente
- [ ] Props tipadas explícitamente.
- [ ] Variantes vía objeto (no condicionales largos).
- [ ] `forwardRef` si recibe ref.
- [ ] `aria-*` correcto.
- [ ] Focus visible.
- [ ] Estados disabled / loading / error si aplica.
- [ ] No imports de libs UI externas.

## Anti-patrones
- Renombrar tokens en archivos de componente.
- Hardcodear hex.
- Hacer el componente "cliente" si no necesita interactividad.
- Wrapper que solo añade un className (preferir composición).
