'use client'

import Link from 'next/link'
import type { Contact, ContactTag, Tag } from '@prisma/client'

type ContactWithTags = Contact & {
  tags: (ContactTag & { tag: Tag })[]
}

interface Props {
  contacts: ContactWithTags[]
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  QUALIFIED: 'Calificado',
  CLIENT: 'Cliente',
}

const STATUS_CLASSES: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  QUALIFIED: 'bg-yellow-50 text-yellow-800',
  CLIENT: 'bg-green-50 text-green-700',
}

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar',
  FORM: 'Formulario',
  MANUAL: 'Manual',
  IMPORT: 'Importado',
}

export function ContactsTable({ contacts }: Props) {
  if (contacts.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-500">
        No hay contactos que coincidan con los filtros.
      </div>
    )
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {['Nombre', 'Email', 'Teléfono', 'Estado', 'Tags', 'Fuente', 'Fecha'].map((h) => (
            <th
              key={h}
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {contacts.map((contact) => (
          <tr key={contact.id} className="hover:bg-gray-50">
            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
              <Link
                href={`/crm/contactos/${contact.id}`}
                className="hover:text-indigo-600 hover:underline"
              >
                {contact.name}
              </Link>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
              {contact.email}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {contact.phone ?? '—'}
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[contact.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {STATUS_LABELS[contact.status] ?? contact.status}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <div className="flex flex-wrap gap-1">
                {contact.tags.length === 0 ? (
                  <span className="text-xs text-gray-400">—</span>
                ) : (
                  contact.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))
                )}
              </div>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
              {SOURCE_LABELS[contact.source] ?? contact.source}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-400">
              {new Intl.DateTimeFormat('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(new Date(contact.createdAt))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
