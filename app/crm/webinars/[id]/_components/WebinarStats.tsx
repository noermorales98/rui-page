import type { RegistrationStatus } from '@prisma/client'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const statCard =
  'rounded-[24px] border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-5 text-center'

interface Props {
  registrations: { status: RegistrationStatus }[]
}

export function WebinarStats({ registrations }: Props) {
  const total = registrations.length
  const attended = registrations.filter(
    (r) => r.status === 'ATTENDED' || r.status === 'PURCHASED',
  ).length
  const purchased = registrations.filter((r) => r.status === 'PURCHASED').length
  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : 0

  return (
    <div className="flex flex-wrap gap-4">
      <div className={statCard}>
        <div className="text-2xl font-bold text-[var(--color-primary)]">{total}</div>
        <div className={`text-xs ${TOK.textSubtle}`}>Registrados</div>
      </div>
      <div className={statCard}>
        <div className="text-2xl font-bold text-[var(--color-secondary)]">{attended}</div>
        <div className={`text-xs ${TOK.textSubtle}`}>Asistieron</div>
      </div>
      <div className={statCard}>
        <div className="text-2xl font-bold text-[var(--color-tertiary)]">{purchased}</div>
        <div className={`text-xs ${TOK.textSubtle}`}>Compraron</div>
      </div>
      <div className={statCard}>
        <div className={`text-2xl font-bold ${TOK.textSubtle}`}>{attendancePct}%</div>
        <div className={`text-xs ${TOK.textSubtle}`}>Asistencia</div>
      </div>
    </div>
  )
}
