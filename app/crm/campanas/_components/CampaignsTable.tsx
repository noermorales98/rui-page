'use client'

import { useState, useTransition } from 'react'
import { Archive, MailCheck, Send, TriangleAlert } from 'lucide-react'
import type { CrmCampaignStatus } from '@prisma/client'
import { archiveCampaign, sendCampaign } from '../actions'

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

const STATUS_LABELS: Record<CrmCampaignStatus, string> = {
  DRAFT: 'Borrador',
  SENDING: 'Enviando',
  SENT: 'Enviada',
  PARTIAL: 'Parcial',
  FAILED: 'Fallida',
  ARCHIVED: 'Archivada',
}

const STATUS_CLASSES: Record<CrmCampaignStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENDING: 'bg-blue-50 text-blue-700',
  SENT: 'bg-green-50 text-green-700',
  PARTIAL: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
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

export function CampaignsTable({ campaigns, smtpReady }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSend(campaign: CampaignRow) {
    const confirmed = window.confirm(
      `¿Enviar "${campaign.name}" ahora? La audiencia se recalculará con sus filtros actuales.`,
    )
    if (!confirmed) return

    setMessage(null)
    startTransition(async () => {
      const result = await sendCampaign(campaign.id)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage(`Envío terminado: ${result?.sent ?? 0} enviados, ${result?.failed ?? 0} fallidos.`)
      }
    })
  }

  function handleArchive(campaign: CampaignRow) {
    const confirmed = window.confirm(`¿Archivar "${campaign.name}"?`)
    if (!confirmed) return

    setMessage(null)
    startTransition(async () => {
      const result = await archiveCampaign(campaign.id)
      if (result.error) setMessage(result.error)
    })
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
        <MailCheck className="mb-4 text-gray-300" size={42} />
        <h2 className="text-base font-semibold text-gray-900">Sin campañas</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Crea un borrador, revisa la audiencia y luego envíalo a tus contactos segmentados.
        </p>
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div className="border-b border-indigo-100 bg-indigo-50 px-6 py-3 text-sm text-indigo-700">
          {message}
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Campaña
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Audiencia
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Resultados
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Ultimo envio
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {campaigns.map((campaign) => {
            const canSend = smtpReady && ['DRAFT', 'FAILED', 'PARTIAL'].includes(campaign.status)
            return (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{campaign.name}</p>
                  <p className="mt-1 max-w-xs truncate text-sm text-gray-500">{campaign.subject}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {campaign.createdBy?.name ?? 'CRM'} · #{campaign.id}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="max-w-xs text-sm text-gray-600">{campaign.audienceLabel}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[campaign.status]}`}>
                    {STATUS_LABELS[campaign.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <span>{campaign.sentCount}/{campaign.recipientCount}</span>
                    {campaign.failedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <TriangleAlert size={14} />
                        {campaign.failedCount}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(campaign.sentAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      disabled={isPending || !canSend}
                      onClick={() => handleSend(campaign)}
                      title={!smtpReady ? 'Configura SMTP para enviar' : 'Enviar campaña'}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-40"
                      aria-label="Enviar campaña"
                    >
                      <Send size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending || campaign.status === 'SENDING'}
                      onClick={() => handleArchive(campaign)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-amber-600 disabled:opacity-40"
                      aria-label="Archivar campaña"
                    >
                      <Archive size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
