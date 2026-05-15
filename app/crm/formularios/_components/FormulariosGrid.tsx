import Link from 'next/link'
import type { CrmFormStatus } from '@prisma/client'
import { FormStatusBadge } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type FormRow = {
  id: number
  name: string
  slug: string
  status: CrmFormStatus
  updatedAt: Date
  _count: { fields: number; submissions: number }
  submissions: { submittedAt: Date }[]
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function FormulariosGrid({ forms }: { forms: FormRow[] }) {
  if (forms.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textStrong}>Sin formularios</p>
        <p className={`mt-1 ${TOK.textMuted}`}>Crea tu primer formulario para capturar leads.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {forms.map((form) => (
        <Link
          key={form.id}
          href={`/crm/formularios/${form.id}`}
          className="flex flex-col gap-3 rounded-2xl border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-container-lowest)] p-4 transition hover:border-[var(--color-outline-variant)] hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${TOK.textStrong}`}>{form.name}</p>
              <code className={`mt-0.5 block font-mono text-xs ${TOK.textSubtle}`}>/formularios/{form.slug}</code>
            </div>
            <FormStatusBadge status={form.status} />
          </div>

          <div className={`flex items-center gap-4 text-xs ${TOK.textMuted}`}>
            <span>{form._count.fields} campos</span>
            <span>{form._count.submissions} respuestas</span>
          </div>

          <p className={`text-xs ${TOK.textSubtle}`}>
            {form.submissions[0]
              ? `Última respuesta: ${formatDate(form.submissions[0].submittedAt)}`
              : `Actualizado: ${formatDate(form.updatedAt)}`}
          </p>
        </Link>
      ))}
    </div>
  )
}
