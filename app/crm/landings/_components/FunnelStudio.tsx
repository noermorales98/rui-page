import Link from 'next/link'
import type { Flow, FlowStep, FunnelPage } from '@prisma/client'
import { normalizeStudioTab, publicPageUrl, type StudioTab } from '../_lib/view-model'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { FunnelContentEditor } from './FunnelContentEditor'
import { FunnelFlowEditor } from './FunnelFlowEditor'
import { FunnelHtmlEditor } from './FunnelHtmlEditor'
import { FunnelPublishPanel } from './FunnelPublishPanel'
import { FunnelThemeForm } from './FunnelThemeForm'

type StudioFunnel = {
  id: number
  name: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  theme: unknown
  webinar: { title: string; link: string | null; date: Date | string } | null
  pages: FunnelPage[]
  categories: Array<{ category: { name: string } }>
}

type Automation = Flow & { steps: FlowStep[] }

const TABS: Array<[StudioTab, string]> = [
  ['paginas', 'Paginas'],
  ['contenido', 'Contenido'],
  ['tema', 'Tema'],
  ['html', 'HTML'],
  ['flujo', 'Flujo'],
  ['publicacion', 'Publicacion'],
]

export function FunnelStudio({
  funnel,
  tab,
  pageId,
  automations,
}: {
  funnel: StudioFunnel
  tab: string | undefined
  pageId: string | undefined
  automations: Automation[]
}) {
  const activeTab = normalizeStudioTab(tab)
  const selectedPage = funnel.pages.find((page) => String(page.id) === pageId) ?? funnel.pages[0]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/crm/landings" className={TOK.linkBack}>Volver a Landings</Link>
        <a href={publicPageUrl(funnel.slug, 'registration', null)} target="_blank" className={TOK.actionSecondary}>
          Ver publico
        </a>
      </div>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
          {funnel.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">{funnel.name}</h1>
        <p className={`mt-2 ${TOK.sectionSubtitle}`}>
          /f/{funnel.slug} {funnel.webinar ? `· ${funnel.webinar.title}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/crm/landings/${funnel.id}?tab=${key}${selectedPage ? `&page=${selectedPage.id}` : ''}`}
            className={`rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold transition ${
              activeTab === key
                ? 'bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)]'
                : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {activeTab === 'paginas' && (
        <div className={`${TOK.panel} ${TOK.panelPad}`}>
          <h2 className={TOK.sectionTitle}>Paginas del funnel</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {funnel.pages.map((page) => (
              <Link
                key={page.id}
                href={`/crm/landings/${funnel.id}?tab=contenido&page=${page.id}`}
                className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-4 transition hover:bg-[var(--color-surface-container-low)]"
              >
                <p className="font-semibold text-[var(--color-on-surface)]">{page.title ?? page.key}</p>
                <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
                  {publicPageUrl(funnel.slug, page.key, page.slug)}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase text-[var(--color-on-surface-variant)]">{page.mode}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'contenido' && selectedPage && (
        <FunnelContentEditor funnelId={funnel.id} page={selectedPage} />
      )}
      {activeTab === 'tema' && <FunnelThemeForm funnelId={funnel.id} theme={funnel.theme} />}
      {activeTab === 'html' && selectedPage && <FunnelHtmlEditor page={selectedPage} />}
      {activeTab === 'flujo' && <FunnelFlowEditor funnelId={funnel.id} automations={automations} />}
      {activeTab === 'publicacion' && <FunnelPublishPanel funnel={funnel} />}
    </div>
  )
}
