'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { deleteContact } from '../actions'
import { Button, Dialog } from '@/app/crm/_components/ui'

const editLinkClass =
  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-3.5 py-2 text-xs font-semibold text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-container)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

export function EditDeleteButtons({
  contact,
  canDelete = true,
}: {
  contact: ContactWithTags
  canDelete?: boolean
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDeleteClick() {
    setConfirmOpen(true)
  }

  const deleteWithId = deleteContact.bind(null, contact.id)

  return (
    <>
      <Dialog
        open={confirmOpen}
        title="¿Dar de baja al contacto?"
        description={`Dar de baja a ${contact.name}. El contacto dejará de aparecer en el listado.`}
        variant="danger"
        confirmLabel="Dar de baja"
        onConfirm={() => { setConfirmOpen(false); formRef.current?.requestSubmit() }}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="flex shrink-0 gap-2">
        <Link href={`/crm/contactos/${contact.id}/editar`} className={editLinkClass}>
          Editar
        </Link>
        {canDelete && (
          <form ref={formRef} action={deleteWithId} className="inline">
            <Button
              type="button"
              onClick={handleDeleteClick}
              variant="danger"
              size="sm"
            >
              Eliminar
            </Button>
          </form>
        )}
      </div>
    </>
  )
}
