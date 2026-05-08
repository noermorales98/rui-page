import type { ReactNode } from 'react'

type Variant = 'lime' | 'blue' | 'gray' | 'amber' | 'red'

const VARIANTS: Record<Variant, string> = {
  lime:  'bg-[#dfff00] text-[#080808]',
  blue:  'bg-[#9bbdf7] text-[#080808]',
  gray:  'bg-[#f0f1f3] text-[#8a8a8a]',
  amber: 'bg-amber-50 text-amber-700',
  red:   'bg-red-50 text-red-600',
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
