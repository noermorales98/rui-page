'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useState, useActionState, useEffect } from 'react'
import type { Tag, Contact, ContactTag } from '@prisma/client'
import { createContact, updateContact } from '../actions'
import { Button, Input } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export type ContactWithTags = Contact & { tags: (ContactTag & { tag: Tag })[] }

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

type ContactFormBase = {
  tags: Tag[]
  contact?: ContactWithTags
  mode: 'create' | 'edit'
}

export type ContactFormProps = ContactFormBase &
  (
    | {
        variant: 'page'
        cancelHref: string
        successHref: string
      }
    | {
        variant: 'modal'
        onClose: () => void
      }
  )

export function ContactForm(props: ContactFormProps) {
  const router = useRouter()
  const { tags, contact, mode, variant } = props
  const [submitted, setSubmitted] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    contact ? contact.tags.map((ct) => ct.tagId) : [],
  )
  const [newTagInput, setNewTagInput] = useState('')
  const [newTagNames, setNewTagNames] = useState<string[]>([])

  const action =
    mode === 'edit' && contact
      ? updateContact.bind(null, contact.id)
      : createContact

  const [state, formAction, isPending] = useActionState(action, null)

  const successHref = variant === 'page' ? props.successHref : null
  const onCloseModal = variant === 'modal' ? props.onClose : null

  useEffect(() => {
    if (state !== null || !submitted || isPending) return

    if (variant === 'page' && successHref) {
      router.push(successHref)
      return
    }
    if (variant === 'modal' && onCloseModal) {
      const id = window.setTimeout(() => {
        onCloseModal()
        setSubmitted(false)
        setNewTagNames([])
        setNewTagInput('')
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [isPending, onCloseModal, router, state, submitted, successHref, variant])

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

  const cancelHref = variant === 'page' ? props.cancelHref : undefined

  return (
    <div>
      {state?.error && <div className={TOK.errorBox}>{state.error}</div>}

      <form
        action={(fd) => {
          selectedTagIds.forEach((id) => fd.append('tagIds', String(id)))
          newTagNames.forEach((name) => fd.append('newTagNames', name))
          setSubmitted(true)
          formAction(fd)
        }}
        className="min-w-0 space-y-4"
      >
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="contact-name" className={TOK.label}>
              Nombre *
            </label>
            <Input
              id="contact-name"
              name="name"
              type="text"
              required
              minLength={2}
              defaultValue={contact?.name}
              className={TOK.fieldBg}
              placeholder="Nombre completo"
            />
          </div>

          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="contact-email" className={TOK.label}>
              Email *
            </label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              required
              defaultValue={contact?.email}
              className={TOK.fieldBg}
              placeholder="email@ejemplo.com"
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="contact-phone" className={TOK.label}>
              Teléfono
            </label>
            <Input
              id="contact-phone"
              name="phone"
              type="tel"
              defaultValue={contact?.phone ?? ''}
              className={TOK.fieldBg}
              placeholder="+52 55 1234 5678"
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="contact-source" className={TOK.label}>
              Fuente
            </label>
            <select
              id="contact-source"
              name="source"
              defaultValue={contact?.source ?? 'MANUAL'}
              className={TOK.selectLg}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="contact-status" className={TOK.label}>
              Estado
            </label>
            <select
              id="contact-status"
              name="status"
              defaultValue={contact?.status ?? 'NEW'}
              className={TOK.selectLg}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="min-w-0">
          <span className={TOK.label}>Tags</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`cursor-pointer rounded-full border-none px-2.5 py-1 text-xs font-semibold text-[var(--color-on-primary)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] ${
                  selectedTagIds.includes(tag.id)
                    ? 'opacity-100 outline outline-2 outline-offset-2 outline-[var(--color-outline)]'
                    : 'opacity-55 hover:opacity-90'
                }`}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          {newTagNames.map((name) => (
            <span key={name} className={TOK.chipNewTag}>
              {name}
              <button
                type="button"
                aria-label={`Quitar tag ${name}`}
                onClick={() => setNewTagNames((p) => p.filter((n) => n !== name))}
                className="cursor-pointer rounded-full border-none bg-transparent p-0 text-[var(--color-on-surface)]/60 transition hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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
              className={`min-w-0 ${TOK.fieldBg}`}
              placeholder="Nuevo tag..."
            />
            <Button type="button" variant="secondary" onClick={addNewTag}>
              Agregar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
          {variant === 'page' && cancelHref ? (
            <Link
              href={cancelHref}
              className={`${TOK.actionSecondary} w-full`}
            >
              Cancelar
            </Link>
          ) : (
            <Button
              type="button"
              onClick={() => variant === 'modal' && props.onClose()}
              variant="secondary"
              fullWidth
              size="lg"
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isPending} fullWidth size="lg">
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear contacto'}
          </Button>
        </div>
      </form>
    </div>
  )
}
