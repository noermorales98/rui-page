import type { ReactNode } from 'react'

interface IconCircleProps {
  children: ReactNode
  className?: string
}

export function IconCircle({ children, className = '' }: IconCircleProps) {
  return (
    <div className={`w-11 h-11 flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] ${className}`}>
      {children}
    </div>
  )
}
