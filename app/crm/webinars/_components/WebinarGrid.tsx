import Link from 'next/link'
import type { RegistrationStatus } from '@prisma/client'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type WebinarWithStats = {
  id: number; title: string; date: Date | string
  platform: string | null; link: string | null; description: string | null
  registrations: { status: RegistrationStatus }[]
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function WebinarGrid({ webinars }: { webinars: WebinarWithStats[] }) {
  if (webinars.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textStrong}>Sin webinars</p>
        <p className={`mt-1 ${TOK.textMuted}`}>Crea tu primer webinar para empezar a captar registros.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {webinars.map((webinar) => {
        const attended = webinar.registrations.filter((r) => r.status === 'ATTENDED').length
        const total = webinar.registrations.length
        const isPast = new Date(webinar.date) < new Date()

        return (
          <Link
            key={webinar.id}
            href={`/crm/webinars/${webinar.id}`}
            className="flex flex-col gap-3 rounded-2xl border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-container-lowest)] p-4 transition hover:border-[var(--color-outline-variant)] hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`flex-1 text-sm font-semibold ${TOK.textStrong}`}>{webinar.title}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isPast ? 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]' : 'bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]'}`}>
                {isPast ? 'Pasado' : 'Próximo'}
              </span>
            </div>

            <p className={`text-xs ${TOK.textMuted}`}>{formatDate(webinar.date)}</p>

            <div className={`flex items-center gap-4 text-xs ${TOK.textSubtle}`}>
              <span>{attended} asistieron</span>
              <span>{total} registros</span>
              {webinar.platform && <span>{webinar.platform}</span>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
