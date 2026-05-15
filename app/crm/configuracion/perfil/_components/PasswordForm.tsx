'use client'

import { useActionState } from 'react'
import { KeyRound } from 'lucide-react'
import { changePassword } from '../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
      {state?.message && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
          {state.message}
        </p>
      )}
      <div>
        <label className={TOK.label}>Contraseña actual</label>
        <input name="currentPassword" type="password" required className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Nueva contraseña</label>
        <input name="newPassword" type="password" required minLength={8} className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Confirmar nueva contraseña</label>
        <input name="confirmPassword" type="password" required className={TOK.inputNative} />
      </div>
      <button type="submit" disabled={pending} className={`${TOK.actionPrimary} w-full justify-center`}>
        <KeyRound size={15} />
        {pending ? 'Cambiando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
