import type { ReactNode } from 'react'

interface IconCircleProps {
  children: ReactNode
  className?: string
}

export function IconCircle({ children, className = '' }: IconCircleProps) {
  return (
    <div className={`w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 ${className}`}>
      {children}
    </div>
  )
}
