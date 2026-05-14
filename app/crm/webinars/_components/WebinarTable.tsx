'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { RegistrationStatus } from '@prisma/client'
import { deleteWebinar } from '../actions'
import { CreateWebinarModal } from './CreateWebinarModal'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export type WebinarWithStats = {
  id: number; title: string; date: Date | string
  platform: string | null; link: string | null; description: string | null
  registrations: { status: RegistrationStatus }[]
}

function formatDateShort(date: Date | string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function WebinarTable({ webinars }: { webinars: WebinarWithStats[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editWebinar, setEditWebinar] = useState<WebinarWithStats | null>(null)

  function handleDelete(e: React.MouseEvent, w: WebinarWithStats) {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar "${w.title}"? Se perderán todos los registros.`)) return
    startTransition(async () => { const r = await deleteWebinar(w.id); if (r?.error) alert(r.error) })
  }

  return (
    <>
      <div className={`${TOK.panel} p-6`}>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <span className={TOK.textMuted}>{webinars.length} webinar{webinars.length !== 1 ? 's' : ''}</span>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} strokeWidth={2} />
            Nuevo webinar
          </Button>
        </div>

        {webinars.length === 0 ? (
          <div className={`py-12 text-center ${TOK.textMuted}`}>No hay webinars todavía. ¡Crea el primero!</div>
        ) : (
          <div>
            {/* Column headers */}
            <div className={`grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] ${TOK.textSubtle}`}
              style={{ gridTemplateColumns: '2fr 1fr 0.6fr 0.6fr 0.6fr 0.4fr' }}>
              <span>Webinar</span><span>Fecha</span>
              <span className="text-center">Reg.</span>
              <span className="text-center">Asist.</span>
              <span className="text-center">Compró</span>
              <span></span>
            </div>

            {webinars.map((w) => (
              <div key={w.id} onClick={() => router.push(`/crm/webinars/${w.id}`)}
                className="mb-1.5 grid cursor-pointer items-center rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-3 last:mb-0"
                style={{ gridTemplateColumns: '2fr 1fr 0.6fr 0.6fr 0.6fr 0.4fr' }}>
                <div>
                  <p className={TOK.textStrong}>{w.title}</p>
                  {w.platform && <p className={`mt-0.5 text-[11px] ${TOK.textSubtle}`}>{w.platform}</p>}
                </div>
                <span className={`text-xs ${TOK.textSubtle}`}>{formatDateShort(w.date)}</span>
                <span className="text-center text-sm font-bold text-[var(--color-primary)]">{w.registrations.length}</span>
                <span className="text-center text-sm font-bold text-[var(--color-secondary)]">
                  {w.registrations.filter((r) => r.status === 'ATTENDED' || r.status === 'PURCHASED').length}
                </span>
                <span className="text-center text-sm font-bold text-[var(--color-tertiary)]">
                  {w.registrations.filter((r) => r.status === 'PURCHASED').length}
                </span>
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); setEditWebinar(w) }}
                    className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)]" aria-label="Editar">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z"/>
                      <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z"/>
                    </svg>
                  </button>
                  <button onClick={(e) => handleDelete(e, w)}
                    className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)]" aria-label="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {createOpen && <CreateWebinarModal onClose={() => setCreateOpen(false)} />}
      {editWebinar && <CreateWebinarModal webinar={editWebinar} onClose={() => setEditWebinar(null)} />}
    </>
  )
}
