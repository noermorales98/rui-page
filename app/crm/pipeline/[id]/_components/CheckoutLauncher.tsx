'use client'

import { useActionState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { createCheckoutSessionAction } from '@/app/crm/ventas/actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  contactId: number
  dealId: number
  defaultProductName?: string
}

export function CheckoutLauncher({ contactId, dealId, defaultProductName }: Props) {
  const [state, action, pending] = useActionState(createCheckoutSessionAction, null)

  useEffect(() => {
    if (state?.url) {
      window.open(state.url, '_blank', 'noopener,noreferrer')
    }
  }, [state?.url])

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="dealId" value={dealId} />

      <div>
        <label className={TOK.label}>Producto</label>
        <input
          name="productName"
          required
          minLength={2}
          defaultValue={defaultProductName ?? ''}
          placeholder="Nombre del curso o producto"
          className={TOK.inputNative}
        />
      </div>

      <div>
        <label className={TOK.label}>Monto (MXN)</label>
        <input
          name="amount"
          required
          type="text"
          inputMode="decimal"
          placeholder="1500.00"
          className={TOK.inputNative}
        />
      </div>

      {state?.error && <p className={TOK.errorBox}>{state.error}</p>}
      {state?.url && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
          Enlace abierto en nueva pestaña.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${TOK.actionAccent} w-full justify-center`}
      >
        <ExternalLink size={15} />
        {pending ? 'Generando enlace...' : 'Generar enlace de pago'}
      </button>
    </form>
  )
}
