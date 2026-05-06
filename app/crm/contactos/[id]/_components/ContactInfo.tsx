import type { Contact, ContactTag, Tag } from '@prisma/client'

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
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Información
      </p>
      <dl className="space-y-4">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="mb-0.5 text-xs text-gray-400">{label}</dt>
            <dd className="text-sm text-gray-900 break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
