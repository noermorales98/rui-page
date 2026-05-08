import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  accent?: boolean
}

export function Card({ children, className = '', accent = false }: CardProps) {
  const base = accent
    ? 'bg-[#dfff00] rounded-[28px] p-6'
    : 'bg-[#f7f8fa] rounded-[28px] border border-[#e5e7eb] p-6'
  return <div className={`${base} ${className}`}>{children}</div>
}
