import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ContactHeader } from './_components/ContactHeader'
import { ContactInfo } from './_components/ContactInfo'
import { ActivityFeed } from './_components/ActivityFeed'
import { AddNoteForm } from './_components/AddNoteForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params
  const contactId = Number(id)

  if (isNaN(contactId)) notFound()

  const [contact, allTags] = await Promise.all([
    prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        tags: { include: { tag: true } },
        activities: {
          include: { createdBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!contact) notFound()

  return (
    <div>
      {/* Back link */}
      <a
        href="/crm/contactos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Contactos
      </a>

      <div className="flex gap-6">
        {/* Left column: contact info */}
        <div className="w-72 flex-shrink-0">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <ContactInfo contact={contact} />
          </div>
        </div>

        {/* Right column: header + activity */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <ContactHeader contact={contact} allTags={allTags} />
            <div className="p-6">
              <AddNoteForm contactId={contact.id} />
              <ActivityFeed activities={contact.activities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
