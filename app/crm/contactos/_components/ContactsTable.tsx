'use client'

import Link from 'next/link'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { ContactStatusBadge } from '@/app/crm/_components/ui'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar', FORM: 'Formulario', MANUAL: 'Manual', IMPORT: 'Importado',
}

export function ContactsTable({ contacts }: { contacts: ContactWithTags[] }) {
  if (contacts.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#8a8a8a]">
        No hay contactos que coincidan con los filtros.
      </div>
    )
  }

  return (
    <div>
      {/* Column headers */}
      <div className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
        style={{ gridTemplateColumns: '2fr 1.8fr 0.8fr 0.8fr 0.8fr' }}>
        <span>Nombre</span>
        <span>Email</span>
        <span>Estado</span>
        <span>Fuente</span>
        <span>Fecha</span>
      </div>

      {/* Rows */}
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0"
          style={{ gridTemplateColumns: '2fr 1.8fr 0.8fr 0.8fr 0.8fr' }}
        >
          <div>
            <Link
              href={`/crm/contactos/${contact.id}`}
              className="text-sm font-semibold text-[#080808] hover:text-[#5a85cc] transition-colors"
            >
              {contact.name}
            </Link>
            {contact.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {contact.tags.map(({ tag }) => (
                  <span key={tag.id} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-[#8a8a8a] truncate">{contact.email}</span>
          <ContactStatusBadge status={contact.status} />
          <span className="text-xs text-[#8a8a8a]">{SOURCE_LABELS[contact.source] ?? contact.source}</span>
          <span className="text-xs text-[#8a8a8a]">
            {new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(contact.createdAt))}
          </span>
        </div>
      ))}
    </div>
  )
}
