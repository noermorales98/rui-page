'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import type { Contact, ContactTag, Tag } from '@prisma/client'
import { ContactStatusBadge, type ListView } from '@/app/crm/_components/ui'
import { Dialog } from '@/app/crm/_components/ui/Dialog'
import { ModalWrapper } from '@/app/crm/_components/ui/ModalWrapper'
import { ContactForm, type ContactWithTags } from './ContactForm'
import { deleteContact } from '../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type ContactWithTagsFull = Contact & { tags: (ContactTag & { tag: Tag })[] }

const SOURCE_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar', FORM: 'Formulario', MANUAL: 'Manual', IMPORT: 'Importado',
}

export function ContactsTable({
  contacts,
  tags,
  view = 'table',
}: {
  contacts: ContactWithTagsFull[]
  tags: Tag[]
  view?: ListView
}) {
  const router = useRouter()
  const [editTarget, setEditTarget] = useState<ContactWithTagsFull | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactWithTagsFull | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    startTransition(async () => {
      await deleteContact(id)
    })
  }

  function handleEditClose() {
    setEditTarget(null)
    router.refresh()
  }

  const ActionButtons = ({ contact }: { contact: ContactWithTagsFull }) => (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        aria-label="Editar contacto"
        onClick={(e) => { e.preventDefault(); setEditTarget(contact) }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-on-surface-variant)] opacity-50 transition hover:bg-[var(--color-surface-container-high)] hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed-dim)]"
      >
        <Pencil size={13} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Eliminar contacto"
        onClick={(e) => { e.preventDefault(); setDeleteTarget(contact) }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-error)] opacity-50 transition hover:bg-[var(--color-error-container)] hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed-dim)]"
      >
        <Trash2 size={13} strokeWidth={2} />
      </button>
    </div>
  )

  if (contacts.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textStrong}>Sin resultados</p>
        <p className={`mt-1 ${TOK.textMuted}`}>No hay contactos que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <>
      {view === 'cards' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex min-h-44 flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-5 transition hover:bg-[var(--color-surface-container-low)]"
            >
              <Link
                href={`/crm/contactos/${contact.id}`}
                className="flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-on-surface)]">{contact.name}</p>
                      <p className={`mt-1 truncate text-xs ${TOK.textSubtle}`}>{contact.email}</p>
                    </div>
                    <ContactStatusBadge status={contact.status} />
                  </div>
                  {contact.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {contact.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-[var(--color-on-primary)]"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              <div className={`mt-5 flex items-center gap-2 text-xs ${TOK.textSubtle}`}>
                <span className="flex-1">{SOURCE_LABELS[contact.source] ?? contact.source}</span>
                <span>{new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(contact.createdAt))}</span>
                <ActionButtons contact={contact} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--color-on-surface-variant)]">
            <span className="flex-1">Nombre</span>
            <span className="hidden w-44 shrink-0 sm:block">Email</span>
            <span className="hidden w-24 shrink-0 md:block">Estado</span>
            <span className="hidden w-20 shrink-0 lg:block">Fuente</span>
            <span className="hidden w-24 shrink-0 lg:block">Fecha</span>
            <div className="w-[60px] shrink-0" />
          </div>

          {/* Rows */}
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="mb-1 flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-2.5 transition last:mb-0 hover:bg-[var(--color-surface-container-low)]"
            >
              {/* Name + tags */}
              <div className="min-w-0 flex-1">
                <Link href={`/crm/contactos/${contact.id}`} className={TOK.linkAccent}>
                  {contact.name}
                </Link>
                {contact.tags.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {contact.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-[var(--color-on-primary)]"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Email */}
              <span className={`hidden w-44 shrink-0 truncate text-xs sm:block ${TOK.textSubtle}`}>
                {contact.email}
              </span>

              {/* Status */}
              <div className="hidden w-24 shrink-0 md:flex">
                <ContactStatusBadge status={contact.status} />
              </div>

              {/* Source */}
              <span className={`hidden w-20 shrink-0 text-xs lg:block ${TOK.textSubtle}`}>
                {SOURCE_LABELS[contact.source] ?? contact.source}
              </span>

              {/* Date */}
              <span className={`hidden w-24 shrink-0 text-xs lg:block ${TOK.textSubtle}`}>
                {new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(contact.createdAt))}
              </span>

              {/* Actions — right side */}
              <div className="w-[60px] shrink-0 flex justify-end">
                <ActionButtons contact={contact} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <ModalWrapper title="Editar contacto" onClose={handleEditClose}>
          <ContactForm
            mode="edit"
            variant="modal"
            contact={editTarget as ContactWithTags}
            tags={tags}
            onClose={handleEditClose}
          />
        </ModalWrapper>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        title="Eliminar contacto"
        description={`¿Seguro que deseas eliminar a ${deleteTarget?.name ?? ''}? Esta acción no se puede deshacer.`}
        confirmLabel={isPending ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
