'use client'

import { useActionState } from 'react'
import { createWebinarFunnelAction } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function FunnelCreateForm() {
  const [state, action, pending] = useActionState(createWebinarFunnelAction, null)

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-2">
      <div>
        <label className={TOK.label}>Nombre del funnel</label>
        <input name="name" required placeholder="Metodo de los 4 Angeles" className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Slug publico</label>
        <input name="slug" required placeholder="metodo-4-angeles" className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Tema del webinar</label>
        <input name="webinarTitle" required placeholder="Webinar en vivo" className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Fecha del webinar</label>
        <input name="webinarDate" required type="datetime-local" className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Plataforma</label>
        <input name="platform" placeholder="Zoom, YouTube, Streamyard" className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Link o iframe del vivo</label>
        <input name="webinarUrl" placeholder="https://..." className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Categorias</label>
        <input name="categories" placeholder="Webinar, Lead Magnet" className={TOK.inputNative} />
      </div>
      <div>
        <label className={TOK.label}>Descripcion</label>
        <textarea name="description" rows={3} className={TOK.inputNativeMultiline} />
      </div>

      {state?.error && <div className={`${TOK.errorBox} lg:col-span-2`}>{state.error}</div>}

      <div className="lg:col-span-2">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? 'Creando...' : 'Crear funnel webinar'}
        </Button>
      </div>
    </form>
  )
}
