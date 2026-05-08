'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmFormStatus } from '@prisma/client'
import { Archive, CheckCircle2, Clipboard, Edit3, ExternalLink, FileText } from 'lucide-react'
import { setFormStatus } from '../actions'

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

const STATUS_LABELS: Record<CrmFormStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

const STATUS_CLASSES: Record<CrmFormStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

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
      <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
        <FileText className="mb-4 text-gray-300" size={42} />
        <h2 className="text-base font-semibold text-gray-900">Sin formularios</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Crea tu primer formulario para capturar leads con campos personalizados.
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
              Formulario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              URL publica
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Campos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Respuestas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Actualizado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {forms.map((form) => (
            <tr key={form.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <Link href={`/crm/formularios/${form.id}`} className="font-medium text-gray-900 hover:text-indigo-700">
                  {form.name}
                </Link>
                <p className="mt-1 font-mono text-xs text-gray-400">#{form.id}</p>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[form.status]}`}>
                  {STATUS_LABELS[form.status]}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    /formularios/{form.slug}
                  </code>
                  <Link
                    href={`/formularios/${form.slug}`}
                    target="_blank"
                    className="text-gray-400 hover:text-indigo-600"
                    aria-label="Abrir formulario publico"
                  >
                    <ExternalLink size={15} />
                  </Link>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{form._count.fields}</td>
              <td className="px-6 py-4 text-sm">
                <Link href={`/crm/formularios/${form.id}/respuestas`} className="text-indigo-600 hover:text-indigo-800">
                  {form._count.submissions}
                </Link>
                {form.submissions[0] && (
                  <p className="mt-1 text-xs text-gray-400">
                    Ultima: {formatDate(form.submissions[0].submittedAt)}
                  </p>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{formatDate(form.updatedAt)}</td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => copyUrl(form.slug)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    aria-label="Copiar URL"
                  >
                    <Clipboard size={16} />
                  </button>
                  <Link
                    href={`/crm/formularios/${form.id}`}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    aria-label="Editar formulario"
                  >
                    <Edit3 size={16} />
                  </Link>
                  {form.status === 'PUBLISHED' ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => changeStatus(form.id, 'DRAFT')}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                      aria-label="Pasar a borrador"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending || form.status === 'ARCHIVED'}
                      onClick={() => changeStatus(form.id, 'PUBLISHED')}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 disabled:opacity-50"
                      aria-label="Publicar"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPending || form.status === 'ARCHIVED'}
                    onClick={() => changeStatus(form.id, 'ARCHIVED')}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-amber-600 disabled:opacity-50"
                    aria-label="Archivar"
                  >
                    <Archive size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
