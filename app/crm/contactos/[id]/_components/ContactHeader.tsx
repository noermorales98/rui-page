import type { Contact, ContactTag, Tag } from '@prisma/client'
import { EditDeleteButtons } from './EditDeleteButtons'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

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

function initials(name: string): string {
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + (parts.length > 1 ? last : '')).toUpperCase()
}

export function ContactHeader({
  contact,
  allTags,
}: {
  contact: ContactWithTags
  allTags: Tag[]
}) {
  return (
    <div className="flex items-start gap-4 border-b border-gray-100 p-6">
      {/* Avatar */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
        {initials(contact.name)}
      </div>

      {/* Name + badges */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-gray-900">{contact.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[contact.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {STATUS_LABELS[contact.status] ?? contact.status}
          </span>
          {contact.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <EditDeleteButtons contact={contact} allTags={allTags} />
    </div>
  )
}
