'use client'

import { Plus, X } from 'lucide-react'
import { useState, useActionState, useEffect } from 'react'
import type { Tag, Contact, ContactTag } from '@prisma/client'
import { createContact, updateContact } from '../actions'
import { Button, Input, ModalWrapper } from '@/app/crm/_components/ui'

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

const fieldClass = 'bg-[#f7f8fa]'
const selectClass = 'min-h-11 w-full rounded-full border border-[#f2f2f2] bg-[#f7f8fa] px-4 py-2.5 text-sm text-[#080808] outline-none transition focus:border-[#9ca3af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]'

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
    if (state === null && submitted && !isPending) {
      const id = window.setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setNewTagNames([])
        setNewTagInput('')
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [isPending, state, submitted])

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
        <span
          role="button"
          tabIndex={0}
          onClick={handleOpen}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleOpen()
            }
          }}
          className="cursor-pointer"
        >
          {trigger}
        </span>
      ) : (
        <Button onClick={handleOpen}>
          <Plus size={16} strokeWidth={2} />
          Nuevo contacto
        </Button>
      )}

      {open && (
        <ModalWrapper onClose={handleClose} title={contact ? 'Editar contacto' : 'Nuevo contacto'}>
            {state?.error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
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
              className="min-w-0 space-y-4"
            >
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Nombre *</label>
                  <Input
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    defaultValue={contact?.name}
                    className={fieldClass}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Email *</label>
                  <Input
                    name="email"
                    type="email"
                    required
                    defaultValue={contact?.email}
                    className={fieldClass}
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Teléfono</label>
                  <Input
                    name="phone"
                    type="tel"
                    defaultValue={contact?.phone ?? ''}
                    className={fieldClass}
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Fuente</label>
                  <select
                    name="source"
                    defaultValue={contact?.source ?? 'MANUAL'}
                    className={selectClass}
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Estado</label>
                  <select
                    name="status"
                    defaultValue={contact?.status ?? 'NEW'}
                    className={selectClass}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`cursor-pointer rounded-full border-none px-2.5 py-1 text-xs font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7] ${selectedTagIds.includes(tag.id) ? 'opacity-100 outline outline-2 outline-offset-2 outline-[#9ca3af]' : 'opacity-55 hover:opacity-85'}`}
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                {newTagNames.map((name) => (
                  <span key={name} className="mr-1 inline-flex items-center gap-1 rounded-full bg-[#9bbdf7] px-2.5 py-1 text-xs font-semibold text-[#080808]">
                    {name}
                    <button
                      type="button"
                      aria-label={`Quitar tag ${name}`}
                      onClick={() => setNewTagNames((p) => p.filter((n) => n !== name))}
                      className="cursor-pointer rounded-full border-none bg-transparent p-0 text-[#080808]/60 transition hover:text-[#080808] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#080808]/40"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </span>
                ))}
                <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                    className={`min-w-0 ${fieldClass}`}
                    placeholder="Nuevo tag..."
                  />
                  <Button type="button" variant="secondary" onClick={addNewTag}>
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={handleClose}
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
                  {isPending ? 'Guardando...' : contact ? 'Guardar cambios' : 'Crear contacto'}
                </Button>
              </div>
            </form>
        </ModalWrapper>
      )}
    </>
  )
}
