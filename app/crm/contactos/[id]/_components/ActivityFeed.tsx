import type { ContactActivity, User } from '@prisma/client'

type ActivityWithUser = ContactActivity & { createdBy: User | null }

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: '📝',
  EMAIL_SENT: '✉️',
  WEBINAR_REGISTERED: '📅',
  WEBINAR_ATTENDED: '📅',
  COURSE_PURCHASED: '🎓',
  FORM_SUBMITTED: '🧾',
  CAMPAIGN_SENT: '✉️',
  SALE_CREATED: '💰',
}

const ACTIVITY_LABELS: Record<string, string> = {
  NOTE: '',
  EMAIL_SENT: 'Se envió email',
  WEBINAR_REGISTERED: 'Registrado al webinar',
  WEBINAR_ATTENDED: 'Asistió al webinar',
  COURSE_PURCHASED: 'Compró curso',
  FORM_SUBMITTED: 'Envió formulario',
  CAMPAIGN_SENT: 'Recibió campaña',
  SALE_CREATED: 'Venta registrada',
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

export function ActivityFeed({ activities }: { activities: ActivityWithUser[] }) {
  if (activities.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-400">Sin actividad registrada.</p>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Historial de actividad
      </p>
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm">
            {ACTIVITY_ICONS[activity.type] ?? '•'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">
              {activity.type === 'NOTE'
                ? activity.body
                : `${ACTIVITY_LABELS[activity.type]}${activity.body ? ` — ${activity.body}` : ''}`}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {relativeTime(new Date(activity.createdAt))}
              {' · '}
              {activity.createdBy?.name ?? 'automático'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
