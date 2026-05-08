'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createWebinar, updateWebinar } from '../actions'
import { Button } from '@/app/crm/_components/ui'

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
        className="bg-white rounded-[28px] p-7 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="webinar-modal-title"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="webinar-modal-title" className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">
            {webinar ? 'Editar webinar' : 'Nuevo webinar'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#8a8a8a] hover:bg-[#e5e7eb] hover:text-[#080808] transition border-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <form action={formAction} onSubmit={() => { submittedRef.current = true }}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={webinar?.title ?? ''}
              placeholder="ej. Cómo desarrollar tu voz"
              className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
              Fecha y hora <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              required
              defaultValue={webinar ? toDatetimeLocal(webinar.date) : ''}
              className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
              Plataforma <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              name="platform"
              defaultValue={webinar?.platform ?? ''}
              placeholder="ej. Zoom"
              className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
              Link <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="url"
              name="link"
              defaultValue={webinar?.link ?? ''}
              placeholder="https://zoom.us/j/..."
              className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa]"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
              Descripción <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="description"
              defaultValue={webinar?.description ?? ''}
              rows={3}
              placeholder="Tema, audiencia objetivo..."
              className="w-full bg-[#f7f8fa] rounded-2xl px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa] resize-none"
            />
          </div>

          {state?.error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
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
