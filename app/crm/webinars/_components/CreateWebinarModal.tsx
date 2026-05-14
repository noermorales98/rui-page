'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createWebinar, updateWebinar } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type WebinarForEdit = {
  id: number
  title: string
  date: Date | string
  platform: string | null
  link: string | null
  description: string | null
}

interface Props {
  webinar?: WebinarForEdit
  onClose: () => void
}

function toDatetimeLocal(date: Date | string): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CreateWebinarModal({ webinar, onClose }: Props) {
  const submittedRef = useRef(false)
  const action = webinar ? updateWebinar.bind(null, webinar.id) : createWebinar
  const [state, formAction, isPending] = useActionState<{ error: string } | null, FormData>(action, null)

  useEffect(() => {
    if (submittedRef.current && !isPending && state === null) {
      onClose()
    }
  }, [isPending, state, onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={TOK.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="webinar-modal-title"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="webinar-modal-title" className={TOK.modalTitle}>
            {webinar ? 'Editar webinar' : 'Nuevo webinar'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={TOK.closeIconBtn}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <form action={formAction} onSubmit={() => { submittedRef.current = true }}>
          <div className="mb-4">
            <label className={TOK.label}>
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={webinar?.title ?? ''}
              placeholder="ej. Cómo desarrollar tu voz"
              className={TOK.inputNative}
            />
          </div>

          <div className="mb-4">
            <label className={TOK.label}>
              Fecha y hora <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              required
              defaultValue={webinar ? toDatetimeLocal(webinar.date) : ''}
              className={TOK.inputNative}
            />
          </div>

          <div className="mb-4">
            <label className={TOK.label}>
              Plataforma <span className="font-normal text-[var(--color-on-surface-variant)]/80">(opcional)</span>
            </label>
            <input
              type="text"
              name="platform"
              defaultValue={webinar?.platform ?? ''}
              placeholder="ej. Zoom"
              className={TOK.inputNative}
            />
          </div>

          <div className="mb-4">
            <label className={TOK.label}>
              Link <span className="font-normal text-[var(--color-on-surface-variant)]/80">(opcional)</span>
            </label>
            <input
              type="url"
              name="link"
              defaultValue={webinar?.link ?? ''}
              placeholder="https://zoom.us/j/..."
              className={TOK.inputNative}
            />
          </div>

          <div className="mb-5">
            <label className={TOK.label}>
              Descripción <span className="font-normal text-[var(--color-on-surface-variant)]/80">(opcional)</span>
            </label>
            <textarea
              name="description"
              defaultValue={webinar?.description ?? ''}
              rows={3}
              placeholder="Tema, audiencia objetivo..."
              className={TOK.inputNativeMultiline}
            />
          </div>

          {state?.error && (
            <div className={TOK.errorBox}>
              {state.error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              fullWidth
              size="lg"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              fullWidth
              size="lg"
            >
              {isPending ? 'Guardando...' : webinar ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
