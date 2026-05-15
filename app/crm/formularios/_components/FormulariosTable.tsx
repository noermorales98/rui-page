'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { CrmFormStatus } from '@prisma/client'
import { Archive, CheckCircle2, Clipboard, Edit3, ExternalLink, FileText } from 'lucide-react'
import { setFormStatus } from '../actions'
import { FormStatusBadge, type ListView } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

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
  view?: ListView
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const ROW_SURFACE =
  'mb-1.5 grid grid-cols-[2fr_1fr_2fr_80px_100px_120px_120px] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-3 transition last:mb-0 hover:bg-[var(--color-surface-container-low)]'

const ACTION_ICON =
  'cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)] disabled:opacity-50'

export function FormulariosTable({ forms, view = 'table' }: Props) {
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
      <div className={TOK.emptyState}>
        <FileText className="mx-auto mb-4 text-[var(--color-on-surface-variant)]/40" size={42} />
        <p className={TOK.textStrong}>Sin formularios</p>
        <p className={`mx-auto mt-1 max-w-sm ${TOK.textMuted}`}>
          Crea tu primer formulario para capturar leads con campos personalizados.
        </p>
      </div>
    )
  }

  if (view === 'cards') {
    return (
      <div>
        {message && (
          <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-low)] px-4 py-3 text-sm text-[var(--color-on-surface)]">
            {message}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="flex min-h-52 flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-5 transition hover:bg-[var(--color-surface-container-low)]"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/crm/formularios/${form.id}`} className={TOK.linkAccent}>
                      {form.name}
                    </Link>
                    <p className={`mt-1 font-mono text-xs ${TOK.textSubtle}`}>#{form.id}</p>
                  </div>
                  <FormStatusBadge status={form.status} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <code className="truncate rounded-[var(--radius-sm)] bg-[var(--color-surface-container-high)] px-2 py-1 text-xs text-[var(--color-on-surface)]">
                    /formularios/{form.slug}
                  </code>
                  <Link
                    href={`/formularios/${form.slug}`}
                    target="_blank"
                    className={`${TOK.textSubtle} transition-colors hover:text-[var(--color-on-surface)]`}
                    aria-label="Abrir formulario público"
                  >
                    <ExternalLink size={15} />
                  </Link>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                <div className="min-w-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-low)] px-3 py-2">
                  <p className="font-semibold text-[var(--color-on-surface)]">{form._count.fields}</p>
                  <p className={TOK.textSubtle}>campos</p>
                </div>
                <Link
                  href={`/crm/formularios/${form.id}/respuestas`}
                  className="min-w-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-low)] px-3 py-2 transition hover:bg-[var(--color-surface-container-high)]"
                >
                  <p className="font-semibold text-[var(--color-on-surface)]">{form._count.submissions}</p>
                  <p className={TOK.textSubtle}>respuestas</p>
                </Link>
                <div className="min-w-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-low)] px-3 py-2">
                  <p className="truncate font-semibold text-[var(--color-on-surface)]">{formatDate(form.updatedAt)}</p>
                  <p className={TOK.textSubtle}>actualizado</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-1">
                  <button type="button" onClick={() => copyUrl(form.slug)} className={ACTION_ICON} aria-label="Copiar URL">
                    <Clipboard size={16} />
                  </button>
                  <Link href={`/crm/formularios/${form.id}`} className={`inline-flex ${ACTION_ICON}`} aria-label="Editar formulario">
                    <Edit3 size={16} />
                  </Link>
                  <button
                    type="button"
                    disabled={isPending || form.status === 'ARCHIVED'}
                    onClick={() => changeStatus(form.id, form.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                    className={ACTION_ICON}
                    aria-label={form.status === 'PUBLISHED' ? 'Pasar a borrador' : 'Publicar'}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={isPending || form.status === 'ARCHIVED'}
                    onClick={() => changeStatus(form.id, 'ARCHIVED')}
                    className={ACTION_ICON}
                    aria-label="Archivar"
                  >
                    <Archive size={16} />
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-low)] px-4 py-3 text-sm text-[var(--color-on-surface)]">
          {message}
        </div>
      )}

      {/* Column headers */}
      <div
        className="grid grid-cols-[2fr_1fr_2fr_80px_100px_120px_120px] px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--color-on-surface-variant)]"
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
          className={ROW_SURFACE}
        >
          {/* Formulario */}
          <div>
            <Link
              href={`/crm/formularios/${form.id}`}
              className={TOK.linkAccent}
            >
              {form.name}
            </Link>
            <p className={`mt-0.5 font-mono text-xs ${TOK.textSubtle}`}>#{form.id}</p>
          </div>

          {/* Estado */}
          <div>
            <FormStatusBadge status={form.status} />
          </div>

          {/* URL pública */}
          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-[var(--color-surface-container-high)] px-2 py-1 text-xs text-[var(--color-on-surface)]">
              /formularios/{form.slug}
            </code>
            <Link
              href={`/formularios/${form.slug}`}
              target="_blank"
              className={`${TOK.textSubtle} transition-colors hover:text-[var(--color-on-surface)]`}
              aria-label="Abrir formulario publico"
            >
              <ExternalLink size={15} />
            </Link>
          </div>

          {/* Campos */}
          <span className={`text-sm ${TOK.textMuted}`}>{form._count.fields}</span>

          {/* Respuestas */}
          <div>
            <Link
              href={`/crm/formularios/${form.id}/respuestas`}
              className={`text-sm ${TOK.linkAccent}`}
            >
              {form._count.submissions}
            </Link>
            {form.submissions[0] && (
              <p className={`mt-0.5 text-xs ${TOK.textSubtle}`}>
                Ultima: {formatDate(form.submissions[0].submittedAt)}
              </p>
            )}
          </div>

          {/* Actualizado */}
          <span className={`text-sm ${TOK.textSubtle}`}>{formatDate(form.updatedAt)}</span>

          {/* Acciones */}
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => copyUrl(form.slug)}
              className={ACTION_ICON}
              aria-label="Copiar URL"
            >
              <Clipboard size={16} />
            </button>
            <Link
              href={`/crm/formularios/${form.id}`}
              className={`inline-flex ${ACTION_ICON}`}
              aria-label="Editar formulario"
            >
              <Edit3 size={16} />
            </Link>
            {form.status === 'PUBLISHED' ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => changeStatus(form.id, 'DRAFT')}
                className={ACTION_ICON}
                aria-label="Pasar a borrador"
              >
                <CheckCircle2 size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending || form.status === 'ARCHIVED'}
                onClick={() => changeStatus(form.id, 'PUBLISHED')}
                className={ACTION_ICON}
                aria-label="Publicar"
              >
                <CheckCircle2 size={16} />
              </button>
            )}
            <button
              type="button"
              disabled={isPending || form.status === 'ARCHIVED'}
              onClick={() => changeStatus(form.id, 'ARCHIVED')}
              className={ACTION_ICON}
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
