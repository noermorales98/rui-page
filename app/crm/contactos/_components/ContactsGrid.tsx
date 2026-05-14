import Link from 'next/link'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { ContactStatusBadge } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar', FORM: 'Formulario', MANUAL: 'Manual', IMPORT: 'Importado',
}

export function ContactsGrid({ contacts }: { contacts: ContactWithTags[] }) {
  if (contacts.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textStrong}>Sin resultados</p>
        <p className={`mt-1 ${TOK.textMuted}`}>No hay contactos que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <Link
          key={contact.id}
          href={`/crm/contactos/${contact.id}`}
          className="flex flex-col gap-3 rounded-2xl border border-[var(--color-outline-variant)]/60 bg-[var(--color-surface-container-lowest)] p-4 transition hover:border-[var(--color-outline-variant)] hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${TOK.textStrong}`}>{contact.name}</p>
              <p className={`mt-0.5 truncate text-xs ${TOK.textSubtle}`}>{contact.email}</p>
            </div>
            <ContactStatusBadge status={contact.status} />
          </div>

          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contact.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className={`flex items-center justify-between text-xs ${TOK.textSubtle}`}>
            <span>{SOURCE_LABELS[contact.source] ?? contact.source}</span>
            {contact.phone && <span>{contact.phone}</span>}
          </div>
        </Link>
      ))}
    </div>
  )
}
