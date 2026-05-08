import type { Contact, ContactTag, Tag } from '@prisma/client'
import { EditDeleteButtons } from './EditDeleteButtons'
import { ContactStatusBadge } from '@/app/crm/_components/ui'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

export function ContactHeader({
  contact,
  allTags,
}: {
  contact: ContactWithTags
  allTags: Tag[]
}) {
  function initials(name: string): string {
    const parts = name.trim().split(' ')
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
  }

  return (
    <div className="flex items-start gap-4 border-b border-[#e5e7eb] p-6">
      <div className="w-12 h-12 rounded-full bg-[#dfff00] flex items-center justify-center text-sm font-bold text-[#080808] flex-shrink-0">
        {initials(contact.name)}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">{contact.name}</h1>
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
      <EditDeleteButtons contact={contact} allTags={allTags} />
    </div>
  )
}
