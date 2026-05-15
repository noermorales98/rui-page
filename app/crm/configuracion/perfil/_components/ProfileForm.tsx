'use client'

import { useActionState } from 'react'
import { Save } from 'lucide-react'
import { updateProfile } from '../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function ProfileForm({ currentName }: { currentName: string }) {
  const [state, action, pending] = useActionState(updateProfile, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
      {state?.message && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
          {state.message}
        </p>
      )}
      <div>
        <label className={TOK.label}>Nombre</label>
        <input name="name" required minLength={2} defaultValue={currentName} className={TOK.inputNative} />
      </div>
      <button type="submit" disabled={pending} className={`${TOK.actionPrimary} w-full justify-center`}>
        <Save size={15} />
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
