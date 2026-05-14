import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContact } from '@/lib/services/contacts'
import { auth } from '@/auth'
import { ContactHeader } from './_components/ContactHeader'
import { ContactInfo } from './_components/ContactInfo'
import { ActivityTimeline } from './_components/ActivityTimeline'
import { AddNoteForm } from './_components/AddNoteForm'
import { ContactDeals } from './_components/ContactDeals'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: Props) {
  const session = await auth()
  const { id } = await params
  const contactId = Number(id)

  if (isNaN(contactId)) notFound()

  const result = await getContact(contactId)
  if (!result.ok) notFound()

  const contact = result.data
  const canDelete = session?.user?.role !== 'ASISTENTE'

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/crm/contactos"
        className={`inline-flex w-fit items-center gap-1.5 text-sm transition-colors ${TOK.textSubtle} hover:text-[var(--color-on-surface)]`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Contactos
      </Link>

      <div className="flex gap-5 items-start">
        {/* Left: info */}
        <div className="w-72 shrink-0">
          <div className={`${TOK.panel} overflow-hidden`}>
            <ContactInfo contact={contact} />
          </div>
        </div>

        {/* Right: header + activity */}
        <div className="min-w-0 flex-1">
          <div className={`${TOK.panel} overflow-hidden`}>
            <ContactHeader contact={contact} canDelete={canDelete} />
            <div className="p-6">
              <ContactDeals contactId={contact.id} contactName={contact.name} />
              <div className="mt-6 border-t border-[var(--color-outline-variant)] pt-6">
                <h3 className="mb-4 text-sm font-semibold tracking-tight text-[var(--color-on-surface)]">
                  Actividad
                </h3>
                <AddNoteForm contactId={contact.id} />
                <ActivityTimeline activities={contact.activities} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
