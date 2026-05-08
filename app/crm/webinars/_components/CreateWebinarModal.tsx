'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createWebinar, updateWebinar } from '../actions'

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
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (submittedRef.current && !isPending && state === null) {
      onClose()
    }
  }, [isPending, state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="webinar-modal-title"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="webinar-modal-title" className="text-lg font-semibold text-gray-900">
            {webinar ? 'Editar webinar' : 'Nuevo webinar'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <form action={formAction} onSubmit={() => { submittedRef.current = true }}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={webinar?.title ?? ''}
              placeholder="ej. Cómo desarrollar tu voz"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fecha y hora <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              required
              defaultValue={webinar ? toDatetimeLocal(webinar.date) : ''}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Plataforma <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              name="platform"
              defaultValue={webinar?.platform ?? ''}
              placeholder="ej. Zoom"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Link <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="url"
              name="link"
              defaultValue={webinar?.link ?? ''}
              placeholder="https://zoom.us/j/..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descripción <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="description"
              defaultValue={webinar?.description ?? ''}
              rows={3}
              placeholder="Tema, audiencia objetivo..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="mb-3 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? 'Guardando...' : webinar ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
