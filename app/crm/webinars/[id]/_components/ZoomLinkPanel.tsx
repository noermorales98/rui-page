'use client'

import { useState, useTransition } from 'react'
import { Link2, RefreshCw, Unlink } from 'lucide-react'
import { linkZoomWebinar, unlinkZoomWebinar, updateViewerCount } from '../../actions'

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

  async function handleLink() {
    startTransition(async () => {
      const result = await linkZoomWebinar(webinarId, zoomId)
      setMessage(result.error ?? 'Webinar vinculado a Zoom.')
    })
  }

  async function handleUnlink() {
    if (!confirm('¿Desvincular este webinar de Zoom?')) return
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
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 space-y-5">
      {/* Zoom section */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Zoom
        </h3>

        {!zoomConnected && (
          <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            Zoom no está conectado.{' '}
            <a href="/crm/configuracion/integraciones" className="underline">
              Conectar
            </a>
          </p>
        )}

        {zoomConnected && (
          <>
            {zoomWebinarId ? (
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                <Link2 className="h-4 w-4 text-indigo-500" />
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {zoomWebinarId}
                </span>
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={isPending}
                  className="ml-auto text-gray-400 hover:text-red-500"
                  title="Desvincular"
                >
                  <Unlink className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="ID del webinar en Zoom"
                  value={zoomId}
                  onChange={(e) => setZoomId(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleLink}
                  disabled={isPending || !zoomId.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
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
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-60"
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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Streamyard — Espectadores
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="0"
            value={viewers}
            onChange={(e) => setViewers(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleViewerCount}
            disabled={isPending}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </div>

      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}
