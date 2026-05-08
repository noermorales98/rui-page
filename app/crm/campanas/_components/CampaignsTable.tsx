'use client'

import { useState, useTransition } from 'react'
import { Archive, MailCheck, Send, TriangleAlert } from 'lucide-react'
import type { CrmCampaignStatus } from '@prisma/client'
import { archiveCampaign, sendCampaign } from '../actions'
import { CampaignStatusBadge } from '@/app/crm/_components/ui'

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

const GRID_COLS = '2fr 1.2fr 120px 100px 160px 88px'

export function CampaignsTable({ campaigns, smtpReady }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSend(campaign: CampaignRow) {
    const confirmed = window.confirm(
      `¿Enviar "${campaign.name}" ahora? La audiencia se recalculará con sus filtros actuales.`,
    )
    if (!confirmed) return

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
  }

  function handleArchive(campaign: CampaignRow) {
    const confirmed = window.confirm(`¿Archivar "${campaign.name}"?`)
    if (!confirmed) return

    setMessage(null)
    setIsError(false)
    startTransition(async () => {
      const result = await archiveCampaign(campaign.id)
      if (result.error) {
        setIsError(true)
        setMessage(result.error)
      }
    })
  }

  if (campaigns.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#8a8a8a]">
        <MailCheck className="mx-auto mb-4 text-[#c8c8c8]" size={42} />
        <p className="font-semibold text-[#080808]">Sin campañas</p>
        <p className="mt-1 max-w-sm mx-auto">
          Crea un borrador, revisa la audiencia y luego envíalo a tus contactos segmentados.
        </p>
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Column headers */}
      <div
        className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
        style={{ gridTemplateColumns: GRID_COLS }}
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
            className="grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            {/* Campaña */}
            <div>
              <p className="font-medium text-[#080808] truncate">{campaign.name}</p>
              <p className="mt-0.5 max-w-xs truncate text-sm text-[#8a8a8a]">{campaign.subject}</p>
              <p className="mt-0.5 text-xs text-[#b0b0b0]">
                {campaign.createdBy?.name ?? 'CRM'} · #{campaign.id}
              </p>
            </div>

            {/* Audiencia */}
            <div>
              <p className="text-sm text-[#555] truncate">{campaign.audienceLabel}</p>
            </div>

            {/* Estado */}
            <div>
              <CampaignStatusBadge status={campaign.status} />
            </div>

            {/* Resultados */}
            <div className="text-sm text-[#555]">
              <div className="flex items-center gap-2">
                <span>{campaign.sentCount}/{campaign.recipientCount}</span>
                {campaign.failedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <TriangleAlert size={13} />
                    {campaign.failedCount}
                  </span>
                )}
              </div>
            </div>

            {/* Último envío */}
            <div className="text-sm text-[#8a8a8a]">{formatDate(campaign.sentAt)}</div>

            {/* Acciones */}
            <div className="flex justify-end gap-1">
              <button
                type="button"
                disabled={isPending || !canSend}
                onClick={() => handleSend(campaign)}
                title={!smtpReady ? 'Configura SMTP para enviar' : 'Enviar campaña'}
                className="rounded-full bg-[#080808] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[#222] transition border-none cursor-pointer font-sans disabled:opacity-50"
                aria-label="Enviar campaña"
              >
                <Send size={13} />
              </button>
              <button
                type="button"
                disabled={isPending || campaign.status === 'SENDING'}
                onClick={() => handleArchive(campaign)}
                className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                aria-label="Archivar campaña"
              >
                <Archive size={15} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
