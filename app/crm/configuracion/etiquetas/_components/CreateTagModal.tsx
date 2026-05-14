'use client'

import { Plus } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { createTag } from '../actions'
import { Button, Input, ModalWrapper } from '@/app/crm/_components/ui'

const DEFAULT_PALETTE = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#a855f7', // purple
  '#0ea5e9', // sky
  '#64748b', // slate
]

export function CreateTagModal() {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(DEFAULT_PALETTE[0])
  const [submitted, setSubmitted] = useState(false)
  const [state, formAction, isPending] = useActionState(createTag, null)

  useEffect(() => {
    if (state === null && submitted && !isPending) {
      const id = window.setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setColor(DEFAULT_PALETTE[0])
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [isPending, state, submitted])

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus size={16} strokeWidth={2} />
        Nueva etiqueta
      </Button>

      {open && (
        <ModalWrapper onClose={() => { setOpen(false); setSubmitted(false) }} title="Nueva etiqueta">
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
              <Input name="name" required minLength={1} maxLength={80} autoFocus />
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-[var(--color-on-surface)]">Color</legend>
              <input type="hidden" name="color" value={color} />
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PALETTE.map((c) => (
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
              <Button type="button" variant="secondary" onClick={() => { setOpen(false); setSubmitted(false) }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creando…' : 'Crear etiqueta'}
              </Button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </>
  )
}
