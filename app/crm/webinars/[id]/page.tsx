import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { WebinarHeader } from './_components/WebinarHeader'
import { WebinarStats } from './_components/WebinarStats'
import { ParticipantsTable } from './_components/ParticipantsTable'
import { AddParticipantButton } from './_components/AddParticipantButton'
import { ImportCsvButton } from './_components/ImportCsvButton'
import { ZoomLinkPanel } from './_components/ZoomLinkPanel'
import { TabBar } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function WebinarDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab = 'info' } = await searchParams
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      registrations: {
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      integration: true,
    },
  })

  if (!webinar) notFound()

  const zoomIntegration = await prisma.integration.findUnique({
    where: { provider: 'ZOOM' },
    select: { status: true },
  })
  const zoomConnected = zoomIntegration?.status === 'ACTIVE'
  const zoomWebinarId = webinar.integration?.externalId ?? null

  const registeredContactIds = webinar.registrations.map((r) => r.contactId)

  const base = `/crm/webinars/${webinarId}`
  const tabs = [
    { key: 'info', label: 'Info', href: base },
    { key: 'participantes', label: 'Participantes', href: `${base}?tab=participantes`, count: webinar.registrations.length },
    { key: 'zoom', label: 'Zoom', href: `${base}?tab=zoom` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/crm/webinars"
        className={`inline-flex items-center gap-1 ${TOK.textMuted} transition-colors hover:text-[var(--color-on-surface)]`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Webinars
      </Link>

      <div className={TOK.panel}>
        <WebinarHeader webinar={webinar} />

        <TabBar tabs={tabs} activeKey={tab} />

        <div className="p-6">
          {tab === 'participantes' && (
            <>
              <WebinarStats registrations={webinar.registrations} />
              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={TOK.textStrong}>
                    Participantes ({webinar.registrations.length})
                  </h3>
                  <div className="flex gap-2">
                    <ImportCsvButton webinarId={webinarId} />
                    <AddParticipantButton
                      webinarId={webinarId}
                      registeredContactIds={registeredContactIds}
                    />
                  </div>
                </div>
                <ParticipantsTable registrations={webinar.registrations} />
              </div>
            </>
          )}

          {tab === 'zoom' && (
            <ZoomLinkPanel
              webinarId={webinar.id}
              zoomWebinarId={zoomWebinarId}
              viewerCount={webinar.viewerCount}
              zoomConnected={zoomConnected}
            />
          )}

          {tab === 'info' && (
            <div className="space-y-3">
              {webinar.description && (
                <p className={`text-sm ${TOK.textMuted}`}>{webinar.description}</p>
              )}
              <div className={`grid gap-4 text-sm sm:grid-cols-2 ${TOK.textMuted}`}>
                {webinar.platform && (
                  <div>
                    <p className={`mb-0.5 text-xs font-semibold uppercase tracking-wider ${TOK.textSubtle}`}>Plataforma</p>
                    <p>{webinar.platform}</p>
                  </div>
                )}
                {webinar.link && (
                  <div>
                    <p className={`mb-0.5 text-xs font-semibold uppercase tracking-wider ${TOK.textSubtle}`}>Enlace</p>
                    <a href={webinar.link} target="_blank" rel="noreferrer" className={TOK.linkAccent}>
                      {webinar.link}
                    </a>
                  </div>
                )}
              </div>
              <WebinarStats registrations={webinar.registrations} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
