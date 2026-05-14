import type { Contact, ContactTag, Tag } from '@prisma/client'
import { EditDeleteButtons } from './EditDeleteButtons'
import { ContactStatusBadge } from '@/app/crm/_components/ui'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

export function ContactHeader({
  contact,
  canDelete = true,
}: {
  contact: ContactWithTags
  canDelete?: boolean
}) {
  function initials(name: string): string {
    const parts = name.trim().split(' ')
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
  }

  return (
    <div className="flex items-start gap-4 border-b border-[var(--color-outline-variant)] p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary-container)] text-sm font-bold text-[var(--color-on-secondary-container)]">
        {initials(contact.name)}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-on-surface)]">{contact.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ContactStatusBadge status={contact.status} />
          {contact.tags.map(({ tag }) => (
            <span key={tag.id} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      </div>
      <EditDeleteButtons contact={contact} canDelete={canDelete} />
    </div>
  )
}
