import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ContactHeader } from './_components/ContactHeader'
import { ContactInfo } from './_components/ContactInfo'
import { ActivityFeed } from './_components/ActivityFeed'
import { AddNoteForm } from './_components/AddNoteForm'
import { ContactDeals } from './_components/ContactDeals'

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
    <div className="flex flex-col gap-6">
      <Link
        href="/crm/contactos"
        className="inline-flex items-center gap-1.5 text-sm text-[#8a8a8a] hover:text-[#080808] transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Contactos
      </Link>

      <div className="flex gap-5 items-start">
        {/* Left: info */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] overflow-hidden">
            <ContactInfo contact={contact} />
          </div>
        </div>

        {/* Right: header + activity */}
        <div className="min-w-0 flex-1">
          <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] overflow-hidden">
            <ContactHeader contact={contact} allTags={allTags} />
            <div className="p-6">
              <ContactDeals contactId={contact.id} contactName={contact.name} />
              <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                <h3 className="mb-4 text-sm font-semibold text-[#080808] tracking-[-0.02em]">Actividad</h3>
                <AddNoteForm contactId={contact.id} />
                <ActivityFeed activities={contact.activities} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
