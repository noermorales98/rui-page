'use client'

import { useRef } from 'react'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { deleteContact } from '../actions'
import { CreateContactModal } from '../../_components/CreateContactModal'
import { Button } from '@/app/crm/_components/ui'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

export function EditDeleteButtons({
  contact,
  allTags,
}: {
  contact: ContactWithTags
  allTags: Tag[]
}) {
  const formRef = useRef<HTMLFormElement>(null)

  function handleDeleteClick() {
    if (window.confirm(`¿Eliminar a ${contact.name}? Esta acción no se puede deshacer.`)) {
      formRef.current?.requestSubmit()
    }
  }

  const deleteWithId = deleteContact.bind(null, contact.id)

  return (
    <div className="flex flex-shrink-0 gap-2">
      <CreateContactModal
        tags={allTags}
        contact={contact}
        trigger={
          <Button variant="secondary" size="sm">
            Editar
          </Button>
        }
      />
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
    </div>
  )
}
