import type { ReactNode } from 'react'

type Variant = 'lime' | 'blue' | 'gray' | 'amber' | 'red'

const VARIANTS: Record<Variant, string> = {
  lime: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]',
  blue: 'bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]',
  gray: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]',
  amber: 'bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed-variant)]',
  red: 'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]',
}

interface BadgeProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}
