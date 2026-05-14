'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import type { Tag } from '@prisma/client'
import { deleteTag, updateTag } from '../actions'
import { Button, Input, ModalWrapper } from '@/app/crm/_components/ui'

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

  const updateAction = updateTag.bind(null, tag.id)
  const deleteAction = deleteTag.bind(null, tag.id)

  const [state, formAction, isPending] = useActionState(updateAction, null)

  useEffect(() => {
    if (state === null && submitted && !isPending) {
      setEditing(false)
      setSubmitted(false)
    }
  }, [isPending, state, submitted])

  function confirmDelete(event: React.MouseEvent<HTMLButtonElement>) {
    const confirmed = window.confirm(
      `¿Archivar la etiqueta «${tag.name}»? Los contactos que la tienen no la verán más en sus filtros, pero la asignación queda en el historial.`,
    )
    if (!confirmed) {
      event.preventDefault()
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
          {tag.name}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono">{tag.color}</span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
        {usage > 0 ? `${usage} contacto${usage === 1 ? '' : 's'}` : '—'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
            title="Editar"
          >
            <Pencil size={14} strokeWidth={2} />
          </button>
          {canDelete && (
            <form action={deleteAction} className="inline">
              <button
                type="submit"
                onClick={confirmDelete}
                className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
                title="Archivar"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </form>
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
              <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
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
