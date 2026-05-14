import type { AuditAction, AuditLog, ContactActivity, User } from '@prisma/client'

export type TimelineEntry =
  | { kind: 'audit'; row: AuditLog & { actor: Pick<User, 'id' | 'name' | 'email'> | null } }
  | { kind: 'activity'; row: ContactActivity & { createdBy: Pick<User, 'id' | 'name' | 'email'> | null } }

const AUDIT_LABEL: Record<AuditAction, string> = {
  CREATE: 'Creado',
  UPDATE: 'Editado',
  DELETE: 'Archivado',
  STATUS_CHANGE: 'Cambio de estado',
  STAGE_CHANGE: 'Cambio de etapa',
  LOGIN: 'Inicio de sesión',
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

function describeAudit(row: TimelineEntry & { kind: 'audit' }): string {
  const r = row.row
  if (r.action === 'STAGE_CHANGE' && r.changes && typeof r.changes === 'object' && 'stage' in r.changes) {
    const stage = (r.changes as { stage?: { from?: string; to?: string } }).stage
    if (stage?.from && stage?.to) return `Movido de ${stage.from} a ${stage.to}`
  }
  if (r.action === 'UPDATE' && r.changes && typeof r.changes === 'object') {
    const fields = Object.keys(r.changes as Record<string, unknown>)
    if (fields.length > 0) return `Actualizado: ${fields.join(', ')}`
  }
  return AUDIT_LABEL[r.action]
}

export function DealTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--color-on-surface-variant)]">Sin actividad registrada.</p>
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => {
        const when = entry.kind === 'audit' ? entry.row.createdAt : entry.row.createdAt
        const actor =
          entry.kind === 'audit'
            ? entry.row.actor?.name ?? entry.row.actor?.email ?? 'sistema'
            : entry.row.createdBy?.name ?? entry.row.createdBy?.email ?? 'sistema'

        const summary =
          entry.kind === 'audit'
            ? describeAudit(entry)
            : entry.row.type === 'NOTE'
              ? (entry.row.body ?? '(nota vacía)')
              : entry.row.type

        const icon = entry.kind === 'audit' ? '⚙️' : entry.row.type === 'NOTE' ? '📝' : '🔔'

        return (
          <li
            key={`${entry.kind}-${entry.row.id}`}
            className="flex items-start gap-3 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3"
          >
            <span className="text-base leading-none">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-on-surface)]">{summary}</p>
              <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
                {relativeTime(new Date(when))} · {actor}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
