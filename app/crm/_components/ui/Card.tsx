import type { ReactNode } from 'react'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface CardProps {
  children: ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className = '', accent = false }: CardProps) {
  const base = accent
    ? 'rounded-[28px] bg-[var(--color-secondary-container)] p-6'
    : `${TOK.panel} p-6`
  return <div className={`${base} ${className}`}>{children}</div>
}
