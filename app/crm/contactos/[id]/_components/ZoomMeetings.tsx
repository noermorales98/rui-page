'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Copy, Loader2 } from 'lucide-react'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type Meeting = {
  id: number
  zoomId: string
  topic: string
  startUrl: string
  joinUrl: string
  password: string
  createdAt: string
}

export function ZoomMeetings({ contactId, contactName }: { contactId: number; contactName: string }) {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const loadMeetings = useCallback(async () => {
    try {
      const res = await fetch(`/api/zoom/meetings?contactId=${contactId}`)
      const data = (await res.json()) as { meetings: Meeting[] }
      setMeetings(data.meetings)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [contactId])

  useEffect(() => { void loadMeetings() }, [loadMeetings])

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/zoom/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: `Reunión con ${contactName}`, contactId }),
      })
      const data = (await res.json()) as { ok?: boolean; meeting?: Meeting; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error al crear la reunión')
        return
      }
      // Navigate to the embedded meeting room inside the CRM
      router.push(`/crm/zoom/sala/${data.meeting!.id}`)
    } catch {
      setError('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  function copyLink(url: string, key: string) {
    void navigator.clipboard.writeText(url)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-3">
      {error && <div className={TOK.errorBox}>{error}</div>}

      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className={`${TOK.actionPrimary} w-full justify-center`}
      >
        {creating ? (
          <Loader2 size={16} strokeWidth={2} className="animate-spin" />
        ) : (
          <Video size={16} strokeWidth={2} />
        )}
        {creating ? 'Creando reunión...' : 'Nueva reunión Zoom'}
      </button>

      {loading ? (
        <p className={`text-center text-sm ${TOK.textMuted}`}>Cargando...</p>
      ) : meetings.length === 0 ? (
        <p className={`text-center text-sm ${TOK.textMuted}`}>Sin reuniones registradas.</p>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-low)] p-3"
            >
              <p className="truncate text-sm font-medium text-[var(--color-on-surface)]">{m.topic}</p>
              <p className={`mt-0.5 text-xs ${TOK.textSubtle}`}>
                {new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(m.createdAt))}
                {m.password && (
                  <span className="ml-2">· Clave: <span className="font-mono">{m.password}</span></span>
                )}
              </p>
              <div className="mt-2 flex gap-2">
                {/* Open embedded room inside CRM */}
                <button
                  type="button"
                  onClick={() => router.push(`/crm/zoom/sala/${m.id}`)}
                  className={`${TOK.actionPrimary} flex-1 justify-center py-1.5 text-xs`}
                >
                  <Video size={13} strokeWidth={2} />
                  Iniciar
                </button>
                {/* Copy invite link for the guest */}
                <button
                  type="button"
                  onClick={() => copyLink(m.joinUrl, `join-${m.id}`)}
                  className={`${TOK.actionSecondary} flex-1 justify-center py-1.5 text-xs`}
                >
                  <Copy size={13} strokeWidth={2} />
                  {copied === `join-${m.id}` ? '¡Copiado!' : 'Copiar invitación'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
