import Link from 'next/link'
import { listFunnels } from '@/lib/services/funnels'
import { Button, ViewToggle, type ListView } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { FunnelsTable } from './_components/FunnelsTable'

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function LandingsPage({ searchParams }: Props) {
  const params = await searchParams
  const view: ListView = params.view === 'cards' ? 'cards' : 'table'
  const funnels = await listFunnels()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Landings</h1>
          <p className={`mt-1.5 ${TOK.sectionSubtitle}`}>
            Funnels publicos, webinars, paginas internas y automatizaciones.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ViewToggle view={view} searchParams={params} />
          <Link href="/crm/landings/nuevo" className="inline-flex">
            <Button type="button">Nuevo funnel</Button>
          </Link>
        </div>
      </div>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <FunnelsTable funnels={funnels} />
      </div>
    </div>
  )
}
