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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-[28px] shadow-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-form-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <FileText size={18} />
                </span>
                <h2 id="new-form-title" className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">
                  Nuevo formulario
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#8a8a8a] hover:bg-[#e5e7eb] transition border-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {state?.error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
                {state.error}
              </div>
            )}

            <form action={formAction} onSubmit={() => setSubmitted(true)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
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
                  className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition placeholder:text-[#aaa]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
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
                  className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 font-mono text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition placeholder:text-[#aaa]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Descripcion</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Texto breve para orientar al visitante."
                  className="w-full bg-[#f7f8fa] rounded-2xl px-5 py-3 text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition placeholder:text-[#aaa] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Boton</label>
                  <input
                    name="submitLabel"
                    defaultValue="Enviar"
                    className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Mensaje final</label>
                  <input
                    name="successMessage"
                    defaultValue="Gracias, recibimos tus datos."
                    className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border-2 border-transparent focus:border-[#dfff00] outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full bg-[#f0f1f3] text-[#080808] rounded-full py-3 text-sm font-medium hover:bg-[#e5e7eb] transition border-none cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#080808] text-white rounded-full py-3 text-sm font-semibold hover:bg-[#222] transition border-none cursor-pointer font-sans disabled:opacity-60"
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
