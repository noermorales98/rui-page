'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWebinar } from '../../actions'
import { CreateWebinarModal } from '../../_components/CreateWebinarModal'
import { Dialog, useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type WebinarForHeader = {
  id: number
  title: string
  date: Date | string
  platform: string | null
  link: string | null
  description: string | null
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

interface Props {
  webinar: WebinarForHeader
}

export function WebinarHeader({ webinar }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { error: toastError } = useToast()

  function handleDelete() {
    setConfirmOpen(true)
  }

  function doDelete() {
    setConfirmOpen(false)
    startTransition(async () => {
      const result = await deleteWebinar(webinar.id)
      if (result?.error) {
        toastError(result.error)
      } else {
        router.push('/crm/webinars')
      }
    })
  }

  return (
    <>
      <Dialog
        open={confirmOpen}
        title="¿Eliminar webinar?"
        description={`Eliminar "${webinar.title}". Se perderán todos los registros.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="flex items-start justify-between px-6 py-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">{webinar.title}</h1>
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-[var(--color-on-surface-variant)]">
            <span>{formatDate(webinar.date)}</span>
            {webinar.platform && <span>{webinar.platform}</span>}
            {webinar.link && (
              <a
                href={webinar.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir enlace del webinar${webinar.platform ? ` en ${webinar.platform}` : ''}`}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                Ver enlace
              </a>
            )}
          </div>
          {webinar.description && (
            <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{webinar.description}</p>
          )}
        </div>
        <div className="ml-4 flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className={TOK.actionSecondary}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-3 py-1.5 text-sm font-medium text-[var(--color-on-error-container)] hover:brightness-95"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editOpen && (
        <CreateWebinarModal webinar={webinar} onClose={() => setEditOpen(false)} />
      )}
    </>
  )
}
