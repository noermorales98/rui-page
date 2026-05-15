import { TOK } from '@/app/crm/_lib/ui-tokens'

type RecipientStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED'

interface Recipient {
  id: number
  email: string
  name: string | null
  status: RecipientStatus
  sentAt: Date | null
  errorMessage: string | null
}

const STATUS_LABELS: Record<RecipientStatus, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  FAILED: 'Fallido',
  SKIPPED: 'Omitido',
}

const STATUS_COLORS: Record<RecipientStatus, string> = {
  PENDING: 'text-[var(--color-on-surface-variant)]',
  SENT: 'text-[var(--color-tertiary)]',
  FAILED: 'text-[var(--color-error)]',
  SKIPPED: 'text-[var(--color-on-surface-variant)]',
}

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export function RecipientsTable({ recipients }: { recipients: Recipient[] }) {
  if (recipients.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textMuted}>Sin destinatarios aún. Envía la campaña para ver el estado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-outline-variant)]">
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Email</th>
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Nombre</th>
            <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Estado</th>
            <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Enviado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-outline-variant)]">
          {recipients.map((r) => (
            <tr key={r.id}>
              <td className="py-2 pr-4 font-mono text-xs text-[var(--color-on-surface)]">{r.email}</td>
              <td className="py-2 pr-4 text-[var(--color-on-surface-variant)]">{r.name ?? '—'}</td>
              <td className="py-2 pr-4">
                <span className={`text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
                {r.errorMessage && (
                  <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--color-error)]" title={r.errorMessage}>
                    {r.errorMessage}
                  </p>
                )}
              </td>
              <td className="py-2 text-xs text-[var(--color-on-surface-variant)]">
                {r.sentAt ? dateFmt.format(new Date(r.sentAt)) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
