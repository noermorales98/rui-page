'use client'

import { useActionState } from 'react'
import { createFunnelLinkedToWebinarAction } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import Link from 'next/link'

type Webinar = { id: number; title: string; date: string; link: string | null }

interface Props {
  webinars: Webinar[]
}

export function FunnelCreateForm({ webinars }: Props) {
  const [state, action, pending] = useActionState(createFunnelLinkedToWebinarAction, null)

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-2">
      <div>
        <label className={TOK.label}>Nombre del funnel</label>
        <input name="name" required placeholder="Metodo de los 4 Angeles" className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Slug público</label>
        <input name="slug" required placeholder="metodo-4-angeles" className={TOK.inputNative} />
      </div>
      <div className="lg:col-span-2">
        <label className={TOK.label}>Webinar vinculado</label>
        {webinars.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
            No hay webinars creados.{' '}
            <Link href="/crm/webinars" className="text-[var(--color-primary)] underline">
              Crea uno primero
            </Link>
            .
          </p>
        ) : (
          <select name="webinarId" required className={TOK.inputNative}>
            <option value="">— Selecciona un webinar —</option>
            {webinars.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title} ({new Date(w.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })})
                {!w.link ? ' ⚠ sin link' : ''}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
          El bloque &quot;Sala webinar&quot; usará el link configurado en el webinar seleccionado.
        </p>
      </div>

      {state?.error && <div className={`${TOK.errorBox} lg:col-span-2`}>{state.error}</div>}

      <div className="lg:col-span-2">
        <Button type="submit" disabled={pending || webinars.length === 0} size="lg">
          {pending ? 'Creando...' : 'Crear landing'}
        </Button>
      </div>
    </form>
  )
}
