import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { CampaignStatusBadge } from '@/app/crm/_components/ui'
import { RecipientsTable } from './_components/RecipientsTable'
import { CampaignSendButton } from './_components/CampaignSendButton'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default async function CampaignDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const campaignId = Number(id)
  if (!Number.isInteger(campaignId) || campaignId < 1) notFound()

  const campaign = await prisma.crmCampaign.findFirst({
    where: { id: campaignId, deletedAt: null },
    select: {
      id: true,
      name: true,
      subject: true,
      previewText: true,
      fromName: true,
      fromEmail: true,
      bodyText: true,
      status: true,
      audienceLabel: true,
      recipientCount: true,
      sentCount: true,
      failedCount: true,
      sentAt: true,
      createdAt: true,
      channel: true,
    },
  })
  if (!campaign) notFound()

  const activeTab = query.tab === 'destinatarios' ? 'destinatarios' : 'info'

  const recipients = activeTab === 'destinatarios'
    ? await prisma.crmCampaignRecipient.findMany({
        where: { campaignId },
        orderBy: { id: 'asc' },
        take: 200,
        select: { id: true, email: true, name: true, status: true, sentAt: true, errorMessage: true },
      })
    : []

  const canSend = ['DRAFT', 'FAILED', 'PARTIAL'].includes(campaign.status)
  const canRetry = ['FAILED', 'PARTIAL'].includes(campaign.status)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/campanas" className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Campañas
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad} flex flex-col gap-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-on-surface)]">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-[var(--color-on-surface-variant)]">{campaign.subject}</p>
          </div>
          {canSend && (
            <CampaignSendButton campaignId={campaign.id} isRetry={canRetry} />
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {([
            { label: 'Destinatarios', value: String(campaign.recipientCount) },
            { label: 'Enviados', value: String(campaign.sentCount) },
            { label: 'Fallidos', value: String(campaign.failedCount) },
            { label: 'Enviado el', value: campaign.sentAt ? dateFmt.format(new Date(campaign.sentAt)) : '—' },
          ] as const).map(({ label, value }) => (
            <div key={label} className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-3">
              <p className="text-xs text-[var(--color-on-surface-variant)]">{label}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-on-surface)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="inline-flex w-fit rounded-[var(--radius-md)] bg-[var(--color-surface-container-high)] p-1">
          {(['info', 'destinatarios'] as const).map((tab) => (
            <Link
              key={tab}
              href={tab === 'info' ? '?' : `?tab=${tab}`}
              className={`rounded-[calc(var(--radius-md)-4px)] px-4 py-2 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
              }`}
            >
              {tab === 'info' ? 'Info' : 'Destinatarios'}
            </Link>
          ))}
        </div>

        {activeTab === 'info' && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className={TOK.label}>Audiencia</dt>
              <dd className="text-[var(--color-on-surface)]">{campaign.audienceLabel}</dd>
            </div>
            <div>
              <dt className={TOK.label}>Remitente</dt>
              <dd className="text-[var(--color-on-surface)]">
                {campaign.fromName ?? '—'}{campaign.fromEmail ? ` <${campaign.fromEmail}>` : ''}
              </dd>
            </div>
            <div>
              <dt className={TOK.label}>Preheader</dt>
              <dd className="text-[var(--color-on-surface)]">{campaign.previewText ?? '—'}</dd>
            </div>
            <div>
              <dt className={TOK.label}>Canal</dt>
              <dd className="text-[var(--color-on-surface)]">{campaign.channel}</dd>
            </div>
            {campaign.bodyText && (
              <div className="sm:col-span-2">
                <dt className={TOK.label}>Contenido</dt>
                <dd className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--color-surface-container-high)] p-3 font-mono text-xs text-[var(--color-on-surface)]">
                  {campaign.bodyText}
                </dd>
              </div>
            )}
          </dl>
        )}

        {activeTab === 'destinatarios' && (
          <RecipientsTable recipients={recipients} />
        )}
      </div>
    </div>
  )
}
