import type { ReactNode } from 'react'
import { Card } from './Card'
import { IconCircle } from './IconCircle'

interface MetricCardProps {
  icon: ReactNode
  value: string | number
  label: string
  accent?: boolean
}

export function MetricCard({ icon, value, label, accent = false }: MetricCardProps) {
  return (
    <Card accent={accent} className="flex flex-col">
      <IconCircle className="mb-4">{icon}</IconCircle>
      <p className="text-3xl font-bold tracking-[-0.04em] text-[#080808]">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-[#8a8a8a]">{label}</p>
    </Card>
  )
}
