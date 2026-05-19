import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { listFunnels } from '@/lib/services/funnels'
import { Button, ViewToggle, type ListView } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { FunnelsTable } from './_components/FunnelsTable'

const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? '1')

const STATIC_PAGES = [
  { label: 'Registro',  href: '/webinar' },
  { label: 'Gracias',   href: '/webinar/gracias' },
  { label: 'Acceso',    href: '/webinar/acceso' },
  { label: 'Sala',      href: '/webinar/sala' },
]

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function LandingsPage({ searchParams }: Props) {
  const params = await searchParams
  const view: ListView = params.view === 'cards' ? 'cards' : 'table'
  const [funnels, mainWebinar] = await Promise.all([
    listFunnels(),
    prisma.webinar.findUnique({
      where: { id: WEBINAR_PUBLIC_ID },
      select: { id: true, title: true, link: true },
    }),
  ])

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

      {/* Static webinar landing */}
      {mainWebinar && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--color-tertiary-container)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-on-tertiary-container)]">
                Webinar principal
              </span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">{mainWebinar.title}</span>
            </div>
            <Link
              href={`/crm/webinars/${WEBINAR_PUBLIC_ID}?tab=paginas`}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              Gestionar →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {STATIC_PAGES.map((p) => (
              <div key={p.href} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-on-surface)]">{p.label}</p>
                  <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)]">{p.href}</p>
                </div>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Ver
                </a>
              </div>
            ))}
          </div>
          {!mainWebinar.link && (
            <p className="mt-3 text-xs text-[var(--color-on-surface-variant)]">
              ⚠ La sala no tiene link configurado.{' '}
              <Link href={`/crm/webinars/${WEBINAR_PUBLIC_ID}`} className="text-[var(--color-primary)] hover:underline">
                Configúralo en el webinar
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <FunnelsTable funnels={funnels} />
      </div>
    </div>
  )
}
