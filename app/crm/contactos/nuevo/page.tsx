import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listTags } from '@/lib/services/tags'
import { ContactForm } from '../_components/ContactForm'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default async function NuevoContactoPage() {
  const tagsResult = await listTags()
  const tags = tagsResult.ok ? tagsResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/contactos" className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Volver a contactos
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <h1 className="mb-6 text-lg font-semibold tracking-tight text-[var(--color-on-surface)]">
          Nuevo contacto
        </h1>
        <ContactForm
          tags={tags}
          mode="create"
          variant="page"
          cancelHref="/crm/contactos"
          successHref="/crm/contactos"
        />
      </div>
    </div>
  )
}
