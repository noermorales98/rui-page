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
        <IconCircle className={accent ? 'bg-white/85' : ''}>{icon}</IconCircle>
        <span className={`h-2.5 w-2.5 rounded-full ${accent ? 'bg-[#080808]' : 'bg-[#dfff00]'}`} />
      </div>
      <div>
        <p className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-[#080808]">{value}</p>
        <p className={`mt-2 text-sm font-semibold tracking-[-0.02em] ${accent ? 'text-[#080808]' : 'text-[#080808]'}`}>
          {label}
        </p>
        {detail && (
          <p className={`mt-1 text-xs font-medium ${accent ? 'text-[#080808]/65' : 'text-[#8a8a8a]'}`}>
            {detail}
          </p>
        )}
      </div>
    </Card>
  )
}
