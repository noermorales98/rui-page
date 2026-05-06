'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addNote } from '../actions'

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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <textarea
          ref={textareaRef}
          name="body"
          rows={3}
          placeholder="Agregar una nota..."
          className="w-full resize-none border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {state?.error && (
          <p className="mb-2 text-xs text-red-600">{state.error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Agregar nota'}
          </button>
        </div>
      </div>
    </form>
  )
}
