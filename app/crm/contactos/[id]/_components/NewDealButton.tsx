'use client'

import { useState } from 'react'
import { CreateDealModal } from '@/app/crm/pipeline/_components/CreateDealModal'

interface Props {
  contactId: number
  contactName: string
}

export function NewDealButton({ contactId, contactName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
      >
        + Nueva oportunidad
      </button>
      {open && (
        <CreateDealModal
          lockedContact={{ id: contactId, name: contactName }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
