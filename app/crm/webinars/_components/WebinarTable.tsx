'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { RegistrationStatus } from '@prisma/client'
import { deleteWebinar } from '../actions'
import { CreateWebinarModal } from './CreateWebinarModal'

export type WebinarWithStats = {
  id: number
  title: string
  date: Date | string
  platform: string | null
  link: string | null
  description: string | null
  registrations: { status: RegistrationStatus }[]
}

function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

interface Props {
  webinars: WebinarWithStats[]
}

export function WebinarTable({ webinars }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editWebinar, setEditWebinar] = useState<WebinarWithStats | null>(null)

  function handleDelete(e: React.MouseEvent, w: WebinarWithStats) {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar "${w.title}"? Se perderán todos los registros.`)) return
    startTransition(async () => {
      await deleteWebinar(w.id)
    })
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <span className="text-sm text-gray-500">
            {webinars.length} webinar{webinars.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Nuevo webinar
          </button>
        </div>

        {webinars.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No hay webinars todavía. ¡Crea el primero!
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide">
                <th className="px-6 py-3 text-left text-gray-500">Webinar</th>
                <th className="px-4 py-3 text-left text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-center text-indigo-600">Reg.</th>
                <th className="px-4 py-3 text-center text-yellow-600">Asist.</th>
                <th className="px-4 py-3 text-center text-green-600">Compró</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {webinars.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => router.push(`/crm/webinars/${w.id}`)}
                  className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{w.title}</div>
                    {w.platform && (
                      <div className="mt-0.5 text-xs text-gray-400">{w.platform}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatDateShort(w.date)}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-indigo-600">
                    {w.registrations.length}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-yellow-600">
                    {w.registrations.filter(
                      (r) => r.status === 'ATTENDED' || r.status === 'PURCHASED',
                    ).length}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-green-600">
                    {w.registrations.filter((r) => r.status === 'PURCHASED').length}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditWebinar(w) }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Editar"
                        aria-label="Editar webinar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                          <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
                          <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, w)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                        aria-label="Eliminar webinar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && <CreateWebinarModal onClose={() => setCreateOpen(false)} />}
      {editWebinar && (
        <CreateWebinarModal webinar={editWebinar} onClose={() => setEditWebinar(null)} />
      )}
    </>
  )
}
