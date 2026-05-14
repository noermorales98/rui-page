import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getContact } from '@/lib/services/contacts'
import { listTags } from '@/lib/services/tags'
import { ContactForm } from '../../_components/ContactForm'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarContactoPage({ params }: Props) {
  const { id } = await params
  const contactId = Number(id)
  if (!Number.isInteger(contactId) || contactId < 1) notFound()

  const [contactResult, tagsResult] = await Promise.all([
    getContact(contactId),
    listTags(),
  ])

  if (!contactResult.ok) notFound()

  const tags = tagsResult.ok ? tagsResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/crm/contactos/${contactId}`} className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Volver al contacto
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <h1 className="mb-6 text-lg font-semibold tracking-tight text-[var(--color-on-surface)]">
          Editar contacto
        </h1>
        <ContactForm
          tags={tags}
          contact={contactResult.data}
          mode="edit"
          variant="page"
          cancelHref={`/crm/contactos/${contactId}`}
          successHref={`/crm/contactos/${contactId}`}
        />
      </div>
    </div>
  )
}
