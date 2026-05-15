'use client'

import { useState, useTransition } from 'react'
import { Archive, MailCheck, Send, TriangleAlert } from 'lucide-react'
import type { CrmCampaignStatus } from '@prisma/client'
import { archiveCampaign, sendCampaign } from '../actions'
import { CampaignStatusBadge, Dialog, type ListView } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export type CampaignRow = {
  id: number
  name: string
  subject: string
  status: CrmCampaignStatus
  audienceLabel: string
  recipientCount: number
  sentCount: number
  failedCount: number
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy: { name: string } | null
}

type Props = {
  campaigns: CampaignRow[]
  smtpReady: boolean
  view?: ListView
}

function formatDate(value: Date | null) {
  if (!value) return 'Sin envio'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const ROW_SURFACE =
  'mb-1.5 grid grid-cols-[2fr_1.2fr_120px_100px_160px_88px] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-3 transition last:mb-0 hover:bg-[var(--color-surface-container-low)]'

const ACTION_ICON =
  'cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)] disabled:opacity-50'

export function CampaignsTable({ campaigns, smtpReady, view = 'table' }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<{ label: string; description: string; action: () => void } | null>(null)

  function handleSend(campaign: CampaignRow) {
    setPendingAction({
      label: 'Enviar',
      description: `Enviar "${campaign.name}" ahora. La audiencia se recalculará con sus filtros actuales.`,
      action: () => {
        setMessage(null)
        setIsError(false)
        startTransition(async () => {
          const result = await sendCampaign(campaign.id)
          if (result?.error) {
            setIsError(true)
            setMessage(result.error)
          } else {
            setIsError(false)
            setMessage(`Envío terminado: ${result?.sent ?? 0} enviados, ${result?.failed ?? 0} fallidos.`)
          }
        })
      },
    })
  }

  function handleArchive(campaign: CampaignRow) {
    setPendingAction({
      label: 'Archivar',
      description: `Archivar "${campaign.name}".`,
      action: () => {
        setMessage(null)
        setIsError(false)
        startTransition(async () => {
          const result = await archiveCampaign(campaign.id)
          if (result.error) {
            setIsError(true)
            setMessage(result.error)
          }
        })
      },
    })
  }

  const dialogOpen = pendingAction !== null

  if (campaigns.length === 0) {
    return (
      <>
        <Dialog
          open={dialogOpen}
          title="¿Confirmar acción?"
          description={pendingAction?.description}
          confirmLabel={pendingAction?.label}
          onConfirm={() => { pendingAction?.action(); setPendingAction(null) }}
          onCancel={() => setPendingAction(null)}
        />
      <div className={TOK.emptyState}>
        <MailCheck className="mx-auto mb-4 text-[var(--color-on-surface-variant)]/40" size={42} />
        <p className={TOK.textStrong}>Sin campañas</p>
        <p className={`mx-auto mt-1 max-w-sm ${TOK.textMuted}`}>
          Crea un borrador, revisa la audiencia y luego envíalo a tus contactos segmentados.
        </p>
      </div>
      </>
    )
  }

  return (
    <>
      <Dialog
        open={dialogOpen}
        title="¿Confirmar acción?"
        description={pendingAction?.description}
        confirmLabel={pendingAction?.label}
        onConfirm={() => { pendingAction?.action(); setPendingAction(null) }}
        onCancel={() => setPendingAction(null)}
      />
    <div>
      {message && (
        <div
          className={
            isError
              ? TOK.errorBox
              : 'mb-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-low)] px-4 py-3 text-sm text-[var(--color-on-surface)]'
          }
        >
          {message}
        </div>
      )}

      {view === 'cards' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => {
            const canSend = smtpReady && ['DRAFT', 'FAILED', 'PARTIAL'].includes(campaign.status)
            return (
              <div
                key={campaign.id}
                className="flex min-h-52 flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-5 transition hover:bg-[var(--color-surface-container-low)]"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate font-medium ${TOK.textStrong}`}>{campaign.name}</p>
                      <p className={`mt-1 line-clamp-2 text-sm ${TOK.textMuted}`}>{campaign.subject}</p>
                    </div>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  <p className={`mt-4 line-clamp-2 text-sm ${TOK.textMuted}`}>{campaign.audienceLabel}</p>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div className={`text-sm ${TOK.textSubtle}`}>
                    <p>{campaign.sentCount}/{campaign.recipientCount} enviados</p>
                    <p className="mt-1">{formatDate(campaign.sentAt)}</p>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      disabled={isPending || !canSend}
                      onClick={() => handleSend(campaign)}
                      title={!smtpReady ? 'Configura SMTP para enviar' : 'Enviar campaña'}
                      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)] transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Enviar campaña"
                    >
                      <Send size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending || campaign.status === 'SENDING'}
                      onClick={() => handleArchive(campaign)}
                      className={ACTION_ICON}
                      aria-label="Archivar campaña"
                    >
                      <Archive size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
      <>

      {/* Column headers */}
      <div
        className="grid grid-cols-[2fr_1.2fr_120px_100px_160px_88px] px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--color-on-surface-variant)]"
      >
        <span>Campaña</span>
        <span>Audiencia</span>
        <span>Estado</span>
        <span>Resultados</span>
        <span>Último envío</span>
        <span className="text-right">Acciones</span>
      </div>

      {/* Rows */}
      {campaigns.map((campaign) => {
        const canSend = smtpReady && ['DRAFT', 'FAILED', 'PARTIAL'].includes(campaign.status)
        return (
          <div
            key={campaign.id}
            className={ROW_SURFACE}
          >
            {/* Campaña */}
            <div>
              <p className={`truncate font-medium ${TOK.textStrong}`}>{campaign.name}</p>
              <p className={`mt-0.5 max-w-xs truncate text-sm ${TOK.textMuted}`}>{campaign.subject}</p>
              <p className={`mt-0.5 text-xs ${TOK.textSubtle}`}>
                {campaign.createdBy?.name ?? 'CRM'} · #{campaign.id}
              </p>
            </div>

            {/* Audiencia */}
            <div>
              <p className={`truncate text-sm ${TOK.textMuted}`}>{campaign.audienceLabel}</p>
            </div>

            {/* Estado */}
            <div>
              <CampaignStatusBadge status={campaign.status} />
            </div>

            {/* Resultados */}
            <div className={`text-sm ${TOK.textMuted}`}>
              <div className="flex items-center gap-2">
                <span>
                  {campaign.sentCount}/{campaign.recipientCount}
                </span>
                {campaign.failedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--color-error)]">
                    <TriangleAlert size={13} />
                    {campaign.failedCount}
                  </span>
                )}
              </div>
            </div>

            {/* Último envío */}
            <div className={`text-sm ${TOK.textSubtle}`}>{formatDate(campaign.sentAt)}</div>

            {/* Acciones */}
            <div className="flex justify-end gap-1">
              <button
                type="button"
                disabled={isPending || !canSend}
                onClick={() => handleSend(campaign)}
                title={!smtpReady ? 'Configura SMTP para enviar' : 'Enviar campaña'}
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)] transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                aria-label="Enviar campaña"
              >
                <Send size={13} />
              </button>
              <button
                type="button"
                disabled={isPending || campaign.status === 'SENDING'}
                onClick={() => handleArchive(campaign)}
                className={ACTION_ICON}
                aria-label="Archivar campaña"
              >
                <Archive size={15} />
              </button>
            </div>
          </div>
        )
      })}
      </>
      )}
    </div>
    </>
  )
}
