import Link from 'next/link'
import { FunnelCreateForm } from '../_components/FunnelCreateForm'
import { listWebinarsAction } from '../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default async function NewFunnelPage() {
  const webinars = await listWebinarsAction()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/landings" className={TOK.linkBack}>
        Volver a Landings
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">
            Nueva landing
          </h1>
          <p className={`mt-2 max-w-2xl ${TOK.sectionSubtitle}`}>
            Vincula esta landing a un webinar. El bloque de sala usará su link automáticamente.
          </p>
        </div>
        <FunnelCreateForm webinars={webinars} />
      </div>
    </div>
  )
}
