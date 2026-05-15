import Link from 'next/link'
import { FunnelCreateForm } from '../_components/FunnelCreateForm'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default function NewFunnelPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/landings" className={TOK.linkBack}>
        Volver a Landings
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
            Funnel tipo webinar
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">
            Crea las paginas de registro, gracias, acceso y sala
          </h1>
          <p className={`mt-2 max-w-3xl ${TOK.sectionSubtitle}`}>
            El sistema crea el webinar conectado y cuatro paginas editables con tema global.
          </p>
        </div>
        <FunnelCreateForm />
      </div>
    </div>
  )
}
