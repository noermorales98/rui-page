import type { ReactNode } from 'react'
import { Card } from './Card'
import { IconCircle } from './IconCircle'

interface MetricCardProps {
  icon: ReactNode
  value: string | number
  label: string
  detail?: string
  accent?: boolean
  className?: string
}

export function MetricCard({ icon, value, label, detail, accent = false, className = '' }: MetricCardProps) {
  return (
    <Card accent={accent} className={`flex min-h-[168px] flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <IconCircle className={accent ? 'bg-[var(--color-surface-container-lowest)]/90' : ''}>{icon}</IconCircle>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            accent ? 'bg-[var(--color-on-secondary-container)]' : 'bg-[var(--color-secondary)]'
          }`}
        />
      </div>
      <div>
        <p
          className={`text-[34px] font-semibold leading-none tracking-[-0.04em] ${
            accent ? 'text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface)]'
          }`}
        >
          {value}
        </p>
        <p
          className={`mt-2 text-sm font-semibold tracking-[-0.02em] ${
            accent ? 'text-[var(--color-on-secondary-container)]' : 'text-[var(--color-on-surface)]'
          }`}
        >
          {label}
        </p>
        {detail && (
          <p
            className={`mt-1 text-xs font-medium ${
              accent ? 'text-[var(--color-on-secondary-container)]/75' : 'text-[var(--color-on-surface-variant)]'
            }`}
          >
            {detail}
          </p>
        )}
      </div>
    </Card>
  )
}
