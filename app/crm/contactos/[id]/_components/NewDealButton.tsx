'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateDealModal } from '@/app/crm/pipeline/_components/CreateDealModal'
import { Button } from '@/app/crm/_components/ui'

interface Props {
  contactId: number
  contactName: string
}

export function NewDealButton({ contactId, contactName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        size="sm"
      >
        <Plus size={14} strokeWidth={2} />
        Nueva oportunidad
      </Button>
      {open && (
        <CreateDealModal
          lockedContact={{ id: contactId, name: contactName }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
