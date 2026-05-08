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
      <div className="rounded-2xl border border-dashed border-[#f2f2f2] bg-white/60 px-6 py-12 text-center">
        <p className="text-sm font-semibold text-[#080808]">Sin resultados</p>
        <p className="mt-1 text-sm text-[#8a8a8a]">No hay contactos que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Column headers */}
      <div className="hidden grid-cols-[2fr_1.8fr_.8fr_.8fr_.8fr] px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a] lg:grid">
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
          className="mb-2 grid items-center gap-3 rounded-2xl bg-white px-4 py-4 transition last:mb-0 lg:grid-cols-[2fr_1.8fr_.8fr_.8fr_.8fr] lg:py-3"
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
          <span className="truncate text-xs text-[#8a8a8a]">{contact.email}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a] lg:hidden">Estado</span>
            <ContactStatusBadge status={contact.status} />
          </div>
          <span className="text-xs text-[#8a8a8a]">
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.07em] lg:hidden">Fuente</span>
            {SOURCE_LABELS[contact.source] ?? contact.source}
          </span>
          <span className="text-xs text-[#8a8a8a]">
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.07em] lg:hidden">Fecha</span>
            {new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(contact.createdAt))}
          </span>
        </div>
      ))}
    </div>
  )
}
