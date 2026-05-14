import type { Contact, ContactTag, Tag } from '@prisma/client'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar',
  FORM: 'Formulario',
  MANUAL: 'Manual',
  IMPORT: 'Importado',
}

export function ContactInfo({ contact }: { contact: ContactWithTags }) {
  const fields = [
    { label: 'Email', value: contact.email },
    { label: 'Teléfono', value: contact.phone ?? '—' },
    { label: 'Fuente', value: SOURCE_LABELS[contact.source] ?? contact.source },
    {
      label: 'Registrado',
      value: new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(contact.createdAt)),
    },
  ]

  return (
    <div className="p-5">
      <p className="mb-4 block text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
        Información
      </p>
      <dl className="space-y-4">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className={`mb-0.5 text-xs ${TOK.textSubtle}`}>{label}</dt>
            <dd className={`break-all text-sm text-[var(--color-on-surface)]`}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
