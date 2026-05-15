'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/app/crm/_components/ui'
import { CreateDealModal } from './CreateDealModal'

export function CreateDealButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleClose() {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        Nueva oportunidad
      </Button>
      {open ? <CreateDealModal initialStage="LEAD" onClose={handleClose} /> : null}
    </>
  )
}
