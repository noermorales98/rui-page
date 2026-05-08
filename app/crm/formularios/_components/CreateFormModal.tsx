'use client'

import { useActionState, useEffect, useState } from 'react'
import { FileText, Plus, X } from 'lucide-react'
import { createForm } from '../actions'
import { slugify } from '../_lib/field-types'

export function CreateFormModal() {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [slug, setSlug] = useState('')
  const [state, formAction, isPending] = useActionState(createForm, null)

  useEffect(() => {
    if (submitted && !isPending && state === null) {
      const id = window.setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setName('')
        setSlug('')
        setSlugTouched(false)
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [isPending, state, submitted])

  function handleClose() {
    setOpen(false)
    setSubmitted(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        <Plus size={16} />
        Nuevo formulario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-form-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <FileText size={18} />
                </span>
                <h2 id="new-form-title" className="text-lg font-semibold text-gray-900">
                  Nuevo formulario
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {state?.error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <form action={formAction} onSubmit={() => setSubmitted(true)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (!slugTouched) setSlug(slugify(event.target.value))
                  }}
                  required
                  minLength={2}
                  placeholder="Registro webinar de mayo"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Slug publico <span className="text-red-500">*</span>
                </label>
                <input
                  name="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setSlug(slugify(event.target.value))
                  }}
                  required
                  minLength={2}
                  placeholder="registro_webinar_mayo"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Texto breve para orientar al visitante."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Boton</label>
                  <input
                    name="submitLabel"
                    defaultValue="Enviar"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mensaje final</label>
                  <input
                    name="successMessage"
                    defaultValue="Gracias, recibimos tus datos."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isPending ? 'Creando...' : 'Crear formulario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
