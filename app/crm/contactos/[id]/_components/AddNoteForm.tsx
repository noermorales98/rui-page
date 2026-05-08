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
      <div className="p-3">
        <textarea
          ref={textareaRef}
          name="body"
          rows={3}
          placeholder="Agregar una nota..."
          className="w-full bg-white rounded-2xl px-4 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition resize-none placeholder:text-[#aaa]"
        />
        {state?.error && (
          <p className="mb-2 text-xs text-red-600">{state.error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#080808] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#222] transition border-none cursor-pointer font-sans disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Agregar nota'}
          </button>
        </div>
      </div>
    </form>
  )
}
