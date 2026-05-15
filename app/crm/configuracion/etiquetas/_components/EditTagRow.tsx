'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useActionState, useEffect, useState, useTransition } from 'react'
import type { Tag } from '@prisma/client'
import { deleteTag, updateTag } from '../actions'
import { Button, Dialog, Input, ModalWrapper, useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const DEFAULT_PALETTE = [
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#0ea5e9',
  '#64748b',
]

export function EditTagRow({
  tag,
  usage,
  canDelete,
}: {
  tag: Tag
  usage: number
  canDelete: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [color, setColor] = useState(tag.color)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()
  const { error: toastError } = useToast()

  const updateAction = updateTag.bind(null, tag.id)

  const [state, formAction, isPending] = useActionState(updateAction, null)

  useEffect(() => {
    if (state === null && submitted && !isPending) {
      const id = window.setTimeout(() => {
        setEditing(false)
        setSubmitted(false)
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [isPending, state, submitted])

  function archiveTag() {
    setDeleteOpen(false)
    startDeleteTransition(async () => {
      try {
        await deleteTag(tag.id)
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'No se pudo archivar la etiqueta.')
      }
    })
  }

  return (
    <tr className="bg-[var(--color-surface-container-lowest)] transition hover:bg-[var(--color-surface-container-low)]">
      <td className="whitespace-nowrap rounded-l-[var(--radius-md)] px-6 py-4 text-sm font-medium text-[var(--color-on-surface)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
          {tag.name}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">
        <span className="rounded-[var(--radius-sm)] bg-[var(--color-surface-container-high)] px-2 py-0.5 font-mono text-xs">{tag.color}</span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">
        {usage > 0 ? `${usage} contacto${usage === 1 ? '' : 's'}` : '—'}
      </td>
      <td className="whitespace-nowrap rounded-r-[var(--radius-md)] px-6 py-4 text-right text-sm">
        <Dialog
          open={deleteOpen}
          title="¿Archivar etiqueta?"
          description={`Archivar "${tag.name}". Los contactos ya no la verán en filtros, pero la asignación queda en el historial.`}
          variant="danger"
          confirmLabel="Archivar"
          onConfirm={archiveTag}
          onCancel={() => setDeleteOpen(false)}
        />
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full p-2 text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
            title="Editar"
          >
            <Pencil size={14} strokeWidth={2} />
          </button>
          {canDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteOpen(true)}
              className="rounded-full p-2 text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] disabled:opacity-50"
              title="Archivar"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </td>

      {editing && (
        <td className="hidden">
          <ModalWrapper
            onClose={() => { setEditing(false); setSubmitted(false); setColor(tag.color) }}
            title={`Editar «${tag.name}»`}
          >
            {state?.error && (
              <div className={TOK.errorBox}>
                {state.error}
              </div>
            )}
            <form
              action={formAction}
              onSubmit={() => setSubmitted(true)}
              className="flex flex-col gap-4"
            >
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-[var(--color-on-surface)]">Nombre</span>
                <Input name="name" required defaultValue={tag.name} minLength={1} maxLength={80} autoFocus />
              </label>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium text-[var(--color-on-surface)]">Color</legend>
                <input type="hidden" name="color" value={color} />
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_PALETTE.concat(DEFAULT_PALETTE.includes(tag.color) ? [] : [tag.color]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] ${c === color ? 'ring-2 ring-offset-2 ring-[var(--color-on-surface)]' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setEditing(false); setSubmitted(false); setColor(tag.color) }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </ModalWrapper>
        </td>
      )}
    </tr>
  )
}
