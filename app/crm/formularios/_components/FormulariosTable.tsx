'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmFormStatus } from '@prisma/client'
import { Archive, CheckCircle2, Clipboard, Edit3, ExternalLink, FileText } from 'lucide-react'
import { setFormStatus } from '../actions'
import { FormStatusBadge } from '@/app/crm/_components/ui'

type FormRow = {
  id: number
  name: string
  slug: string
  status: CrmFormStatus
  updatedAt: Date
  _count: { fields: number; submissions: number }
  submissions: { submittedAt: Date }[]
}

interface Props {
  forms: FormRow[]
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const GRID_COLS = '2fr 1fr 2fr 80px 100px 120px 120px'

export function FormulariosTable({ forms }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function changeStatus(formId: number, status: CrmFormStatus) {
    setMessage(null)
    startTransition(async () => {
      const result = await setFormStatus(formId, status)
      if (result.error) setMessage(result.error)
    })
  }

  async function copyUrl(slug: string) {
    const url = `${window.location.origin}/formularios/${slug}`
    await navigator.clipboard.writeText(url)
    setMessage('URL copiada')
  }

  if (forms.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#8a8a8a]">
        <FileText className="mx-auto mb-4 text-gray-300" size={42} />
        <h2 className="text-base font-semibold text-gray-900">Sin formularios</h2>
        <p className="mt-1 max-w-sm mx-auto text-sm text-[#8a8a8a]">
          Crea tu primer formulario para capturar leads con campos personalizados.
        </p>
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          {message}
        </div>
      )}

      {/* Column headers */}
      <div
        className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        <span>Formulario</span>
        <span>Estado</span>
        <span>URL pública</span>
        <span>Campos</span>
        <span>Respuestas</span>
        <span>Actualizado</span>
        <span className="text-right">Acciones</span>
      </div>

      {/* Rows */}
      {forms.map((form) => (
        <div
          key={form.id}
          className="grid items-center bg-white rounded-2xl px-4 py-3 mb-1.5 last:mb-0"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          {/* Formulario */}
          <div>
            <Link
              href={`/crm/formularios/${form.id}`}
              className="font-medium text-[#080808] hover:text-indigo-700"
            >
              {form.name}
            </Link>
            <p className="mt-0.5 font-mono text-xs text-[#8a8a8a]">#{form.id}</p>
          </div>

          {/* Estado */}
          <div>
            <FormStatusBadge status={form.status} />
          </div>

          {/* URL pública */}
          <div className="flex items-center gap-2">
            <code className="rounded bg-[#f0f1f3] px-2 py-1 text-xs text-[#4a4a4a]">
              /formularios/{form.slug}
            </code>
            <Link
              href={`/formularios/${form.slug}`}
              target="_blank"
              className="text-[#8a8a8a] hover:text-indigo-600"
              aria-label="Abrir formulario publico"
            >
              <ExternalLink size={15} />
            </Link>
          </div>

          {/* Campos */}
          <span className="text-sm text-[#4a4a4a]">{form._count.fields}</span>

          {/* Respuestas */}
          <div>
            <Link
              href={`/crm/formularios/${form.id}/respuestas`}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {form._count.submissions}
            </Link>
            {form.submissions[0] && (
              <p className="mt-0.5 text-xs text-[#8a8a8a]">
                Ultima: {formatDate(form.submissions[0].submittedAt)}
              </p>
            )}
          </div>

          {/* Actualizado */}
          <span className="text-sm text-[#8a8a8a]">{formatDate(form.updatedAt)}</span>

          {/* Acciones */}
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => copyUrl(form.slug)}
              className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors border-none bg-transparent cursor-pointer"
              aria-label="Copiar URL"
            >
              <Clipboard size={16} />
            </button>
            <Link
              href={`/crm/formularios/${form.id}`}
              className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors"
              aria-label="Editar formulario"
            >
              <Edit3 size={16} />
            </Link>
            {form.status === 'PUBLISHED' ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => changeStatus(form.id, 'DRAFT')}
                className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                aria-label="Pasar a borrador"
              >
                <CheckCircle2 size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending || form.status === 'ARCHIVED'}
                onClick={() => changeStatus(form.id, 'PUBLISHED')}
                className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                aria-label="Publicar"
              >
                <CheckCircle2 size={16} />
              </button>
            )}
            <button
              type="button"
              disabled={isPending || form.status === 'ARCHIVED'}
              onClick={() => changeStatus(form.id, 'ARCHIVED')}
              className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-[#f0f1f3] transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
              aria-label="Archivar"
            >
              <Archive size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
