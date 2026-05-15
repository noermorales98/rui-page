'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addNote } from '../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function AddNoteForm({ contactId }: { contactId: number }) {
  const boundAction = addNote.bind(null, contactId)
  const [state, formAction, isPending] = useActionState(boundAction, null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state === null && textareaRef.current) {
      textareaRef.current.value = ''
    }
  }, [state])

  return (
    <form action={formAction}>
      <div className="p-3">
        <textarea
          ref={textareaRef}
          name="body"
          rows={3}
          placeholder="Agregar una nota..."
          className={TOK.inputNativeMultiline}
        />
        {state?.error && (
          <p className="mb-2 text-xs text-[var(--color-error)]">{state.error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className={TOK.actionPrimary}
          >
            {isPending ? 'Guardando...' : 'Agregar nota'}
          </button>
        </div>
      </div>
    </form>
  )
}
