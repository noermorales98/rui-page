'use client'

import { useState, useActionState, useEffect } from 'react'
import type { Tag, Contact, ContactTag } from '@prisma/client'
import { createContact, updateContact } from '../actions'

type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

interface Props {
  tags: Tag[]
  contact?: ContactWithTags
  trigger?: React.ReactNode
}

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'FORM', label: 'Formulario' },
  { value: 'IMPORT', label: 'Importado' },
]

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'QUALIFIED', label: 'Calificado' },
  { value: 'CLIENT', label: 'Cliente' },
]

export function CreateContactModal({ tags, contact, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    contact ? contact.tags.map((ct) => ct.tagId) : [],
  )
  const [newTagInput, setNewTagInput] = useState('')
  const [newTagNames, setNewTagNames] = useState<string[]>([])

  const action = contact
    ? updateContact.bind(null, contact.id)
    : createContact

  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state === null && submitted) {
      setOpen(false)
      setSubmitted(false)
      setNewTagNames([])
      setNewTagInput('')
    }
  }, [state, submitted])

  function handleOpen() {
    setSelectedTagIds(contact ? contact.tags.map((ct) => ct.tagId) : [])
    setNewTagNames([])
    setNewTagInput('')
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setSubmitted(false)
  }

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function addNewTag() {
    const name = newTagInput.trim()
    if (name && !newTagNames.includes(name)) {
      setNewTagNames((prev) => [...prev, name])
    }
    setNewTagInput('')
  }

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Nuevo contacto
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {contact ? 'Editar contacto' : 'Nuevo contacto'}
              </h2>
              <button onClick={handleClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <form
              key={open ? 'open' : 'closed'}
              action={(fd) => {
                // Inject selected tag IDs and new tag names into FormData
                selectedTagIds.forEach((id) => fd.append('tagIds', String(id)))
                newTagNames.forEach((name) => fd.append('newTagNames', name))
                setSubmitted(true)
                formAction(fd)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    defaultValue={contact?.name}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={contact?.email}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={contact?.phone ?? ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fuente</label>
                  <select
                    name="source"
                    defaultValue={contact?.source ?? 'MANUAL'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    name="status"
                    defaultValue={contact?.status ?? 'NEW'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded px-2.5 py-1 text-xs font-medium text-white transition-opacity ${selectedTagIds.includes(tag.id) ? 'opacity-100 ring-2 ring-offset-1 ring-indigo-500' : 'opacity-50'}`}
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                {newTagNames.map((name) => (
                  <span key={name} className="mr-1 inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                    {name}
                    <button type="button" onClick={() => setNewTagNames((p) => p.filter((n) => n !== name))}>×</button>
                  </span>
                ))}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nuevo tag..."
                  />
                  <button
                    type="button"
                    onClick={addNewTag}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isPending ? 'Guardando...' : contact ? 'Guardar cambios' : 'Crear contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
