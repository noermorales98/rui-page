import Link from 'next/link'
import type { Flow, FlowStep, FunnelPage } from '@prisma/client'
import type { FunnelTheme } from '@/lib/funnels/types'
import { normalizeStudioTab, publicPageUrl, type StudioTab } from '../_lib/view-model'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { LandingBuilder } from './LandingBuilder'
import { FunnelFlowEditor } from './FunnelFlowEditor'
import { FunnelHtmlEditor } from './FunnelHtmlEditor'
import { FunnelPublishPanel } from './FunnelPublishPanel'
import { FunnelThemeForm } from './FunnelThemeForm'
import { FunnelPagesTab } from './FunnelPagesTab'
import { HugeiconsIcon } from '@hugeicons/react'
import EyeIcon from '@hugeicons/core-free-icons/EyeIcon'

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
  ['paginas',    'Páginas'],
  ['contenido',  'Contenido'],
  ['tema',       'Tema'],
  ['flujo',      'Flujo'],
  ['publicacion','Publicación'],
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
  const statusLabel = funnel.status === 'PUBLISHED' ? 'Publicado' : funnel.status === 'ARCHIVED' ? 'Archivado' : 'Borrador'
  const statusColor = funnel.status === 'PUBLISHED'
    ? 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]'
    : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'

  return (
    <div className="flex flex-col gap-3">
      {/* Compact header */}
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/crm/landings" className={TOK.linkBack} aria-label="Volver a Landings">←</Link>
          <span className="truncate font-semibold text-[var(--color-on-surface)]">{funnel.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] select-none">
              Avanzado
            </summary>
            <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Configuración avanzada</p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <div>
                  <span className="text-xs text-[var(--color-on-surface-variant)]">URL pública</span>
                  <p className="font-mono text-xs text-[var(--color-on-surface)]">/f/{funnel.slug}</p>
                </div>
                {funnel.webinar && (
                  <div>
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Webinar</span>
                    <p className="text-xs text-[var(--color-on-surface)]">{funnel.webinar.title}</p>
                  </div>
                )}
                {selectedPage && (
                  <div className="border-t border-[var(--color-outline-variant)] pt-2">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Página activa</span>
                    <p className="text-xs text-[var(--color-on-surface)]">{selectedPage.title ?? selectedPage.key} — modo {selectedPage.mode}</p>
                    {selectedPage.mode === 'HTML' && (
                      <Link
                        href={`/crm/landings/${funnel.id}?tab=html&page=${selectedPage.id}`}
                        className="mt-1 inline-block text-xs text-[var(--color-primary)] underline"
                      >
                        Editar HTML
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </details>
          <a
            href={publicPageUrl(funnel.slug, selectedPage?.key ?? 'registration', selectedPage?.slug ?? null)}
            target="_blank"
            rel="noreferrer"
            className={`${TOK.actionSecondary} flex items-center gap-1.5`}
          >
            <HugeiconsIcon icon={EyeIcon} size={14} />
            Ver
          </a>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === 'paginas' && (
        <FunnelPagesTab funnel={funnel} />
      )}
      {activeTab === 'contenido' && selectedPage && (
        <LandingBuilder page={selectedPage} theme={funnel.theme as FunnelTheme | null | undefined} />
      )}
      {activeTab === 'tema' && <FunnelThemeForm funnelId={funnel.id} theme={funnel.theme} />}
      {activeTab === 'flujo' && <FunnelFlowEditor funnelId={funnel.id} automations={automations} />}
      {activeTab === 'publicacion' && <FunnelPublishPanel funnel={funnel} />}
      {/* html tab hidden from tab bar but still accessible via advanced settings drawer */}
      {activeTab === 'html' && selectedPage && <FunnelHtmlEditor page={selectedPage} />}
    </div>
  )
}
