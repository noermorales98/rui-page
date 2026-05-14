import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)] hover:opacity-90',
  secondary:
    'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]',
  accent:
    'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] hover:brightness-95',
  ghost:
    'bg-transparent text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-lowest)] hover:text-[var(--color-on-surface)]',
  danger:
    'bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:brightness-95',
}

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 py-2 text-xs',
  md: 'min-h-10 px-5 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--color-outline-variant)] font-sans font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] disabled:pointer-events-none disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
