'use client'

import { useState, useTransition } from 'react'
import { Link2, RefreshCw, Unlink } from 'lucide-react'
import { linkZoomWebinar, unlinkZoomWebinar, updateViewerCount } from '../../actions'
import { Dialog } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  webinarId: number
  zoomWebinarId: string | null
  viewerCount: number | null
  zoomConnected: boolean
}

export function ZoomLinkPanel({ webinarId, zoomWebinarId, viewerCount, zoomConnected }: Props) {
  const [zoomId, setZoomId] = useState('')
  const [viewers, setViewers] = useState(viewerCount?.toString() ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmUnlinkOpen, setConfirmUnlinkOpen] = useState(false)

  async function handleLink() {
    startTransition(async () => {
      const result = await linkZoomWebinar(webinarId, zoomId)
      setMessage(result.error ?? 'Webinar vinculado a Zoom.')
    })
  }

  function handleUnlink() {
    setConfirmUnlinkOpen(true)
  }

  function doUnlink() {
    setConfirmUnlinkOpen(false)
    startTransition(async () => {
      const result = await unlinkZoomWebinar(webinarId)
      setMessage(result.error ?? 'Desvinculado.')
    })
  }

  async function handleSync() {
    startTransition(async () => {
      const res = await fetch(`/api/zoom/sync/${webinarId}`, { method: 'POST' })
      const data = (await res.json()) as { imported?: number; skipped?: number; error?: string }
      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage(`Sync completo: ${data.imported ?? 0} importados, ${data.skipped ?? 0} omitidos.`)
      }
    })
  }

  async function handleViewerCount() {
    const n = Number(viewers)
    if (isNaN(n)) { setMessage('Número inválido'); return }
    startTransition(async () => {
      const result = await updateViewerCount(webinarId, n)
      setMessage(result.error ?? 'Métricas guardadas.')
    })
  }

  return (
    <>
      <Dialog
        open={confirmUnlinkOpen}
        title="¿Desvincular de Zoom?"
        description="Los datos de sincronización se perderán."
        variant="danger"
        confirmLabel="Desvincular"
        onConfirm={doUnlink}
        onCancel={() => setConfirmUnlinkOpen(false)}
      />
    <div className={`${TOK.panel} space-y-5 p-5`}>
      {/* Zoom section */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
          Zoom
        </h3>

        {!zoomConnected && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-secondary-fixed)] px-3 py-2 text-sm text-[var(--color-on-secondary-fixed-variant)]">
            Zoom no está conectado.{' '}
            <a href="/crm/configuracion/integraciones" className="underline">
              Conectar
            </a>
          </p>
        )}

        {zoomConnected && (
          <>
            {zoomWebinarId ? (
              <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
                <Link2 className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="rounded bg-[var(--color-surface-container-high)] px-2 py-0.5 font-mono text-xs">
                  {zoomWebinarId}
                </span>
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={isPending}
                  className="ml-auto text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)]"
                  title="Desvincular"
                >
                  <Unlink className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  placeholder="ID del webinar en Zoom"
                  value={zoomId}
                  onChange={(e) => setZoomId(e.target.value)}
                  className={`${TOK.inputCompact} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleLink}
                  disabled={isPending || !zoomId.trim()}
                  className={`${TOK.actionPrimary} px-3 py-1.5 disabled:opacity-60`}
                >
                  Vincular
                </button>
              </div>
            )}

            {zoomWebinarId && (
              <button
                type="button"
                onClick={handleSync}
                disabled={isPending}
                className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-container)] disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar desde Zoom
              </button>
            )}
          </>
        )}
      </div>

      {/* Streamyard metrics */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
          Streamyard — Espectadores
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="0"
            value={viewers}
            onChange={(e) => setViewers(e.target.value)}
            className={`${TOK.inputCompact} w-32`}
          />
          <button
            type="button"
            onClick={handleViewerCount}
            disabled={isPending}
            className={`${TOK.actionSecondary} px-3 py-1.5 disabled:opacity-60`}
          >
            Guardar
          </button>
        </div>
      </div>

      {message && (
        <p className="text-sm text-[var(--color-on-surface-variant)]">{message}</p>
      )}
    </div>
    </>
  )
}
