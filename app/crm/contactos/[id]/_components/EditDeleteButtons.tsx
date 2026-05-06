'use client'

import { useRef } from 'react'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { deleteContact } from '../actions'
import { CreateContactModal } from '../../_components/CreateContactModal'

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
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Editar
          </button>
        }
      />
      <form ref={formRef} action={deleteWithId} className="inline">
        <button
          type="button"
          onClick={handleDeleteClick}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Eliminar
        </button>
      </form>
    </div>
  )
}
