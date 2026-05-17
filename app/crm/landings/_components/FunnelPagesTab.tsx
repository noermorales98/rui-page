'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import type { FunnelPage } from '@prisma/client'
import { HugeiconsIcon } from '@hugeicons/react'
import Edit02Icon from '@hugeicons/core-free-icons/Edit02Icon'
import EyeIcon from '@hugeicons/core-free-icons/EyeIcon'
import Delete02Icon from '@hugeicons/core-free-icons/Delete02Icon'
import UserAdd01Icon from '@hugeicons/core-free-icons/UserAdd01Icon'
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon'
import LockPasswordIcon from '@hugeicons/core-free-icons/LockPasswordIcon'
import Video01Icon from '@hugeicons/core-free-icons/Video01Icon'
import File01Icon from '@hugeicons/core-free-icons/File01Icon'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon'
import { addFunnelPageAction, deleteFunnelPageAction } from '../actions'
import { publicPageUrl } from '../_lib/view-model'

type FunnelPageKind = 'REGISTRATION' | 'THANK_YOU' | 'ACCESS' | 'ROOM' | 'CUSTOM'

const KIND_LABELS: Record<FunnelPageKind, string> = {
  REGISTRATION: 'Registro',
  THANK_YOU:    'Gracias',
  ACCESS:       'Acceso',
  ROOM:         'Sala',
  CUSTOM:       'Personalizada',
}

const KIND_ICONS: Record<FunnelPageKind, typeof UserAdd01Icon> = {
  REGISTRATION: UserAdd01Icon,
  THANK_YOU:    CheckmarkCircle01Icon,
  ACCESS:       LockPasswordIcon,
  ROOM:         Video01Icon,
  CUSTOM:       File01Icon,
}

const ALL_KINDS: FunnelPageKind[] = ['REGISTRATION', 'THANK_YOU', 'ACCESS', 'ROOM']

type StudioFunnel = {
  id: number
  slug: string
  pages: FunnelPage[]
}

export function FunnelPagesTab({ funnel }: { funnel: StudioFunnel }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const existingKinds = new Set(funnel.pages.map((p) => p.kind as FunnelPageKind))
  const availableKinds = ALL_KINDS.filter((k) => !existingKinds.has(k))

  function handleAdd(kind: FunnelPageKind) {
    setShowAddMenu(false)
    setError(null)
    startTransition(async () => {
      const result = await addFunnelPageAction(funnel.id, kind)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete(pageId: number, title: string) {
    if (!confirm(`¿Eliminar la página "${title}"? Esta acción no se puede deshacer.`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteFunnelPageAction(pageId)
      if (result.error) setError(result.error)
    })
  }

  const sortedPages = [...funnel.pages].sort((a, b) => a.position - b.position)

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-6">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
        Flujo de páginas
      </h2>

      <div className="flex flex-wrap items-start gap-2">
        {sortedPages.map((page, index) => {
          const kind = page.kind as FunnelPageKind
          const Icon = KIND_ICONS[kind] ?? File01Icon
          const pageTitle = page.title ?? KIND_LABELS[kind] ?? page.key
          const pageUrl = publicPageUrl(funnel.slug, page.key, page.slug)

          return (
            <div key={page.id} className="flex items-start gap-2">
              <div className="flex w-40 flex-col gap-2 rounded-[var(--radius-lg)] border-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] p-3">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Icon} size={18} className="shrink-0 text-[var(--color-primary)]" />
                  <span className="truncate text-xs font-semibold text-[var(--color-on-surface)]">{pageTitle}</span>
                </div>
                <p className="truncate font-mono text-[10px] text-[var(--color-on-surface-variant)]">{pageUrl}</p>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/crm/landings/${funnel.id}?tab=contenido&page=${page.id}`}
                    title="Editar"
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
                  >
                    <HugeiconsIcon icon={Edit02Icon} size={14} />
                  </Link>
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Previsualizar"
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
                  >
                    <HugeiconsIcon icon={EyeIcon} size={14} />
                  </a>
                  <button
                    type="button"
                    title="Eliminar"
                    disabled={isPending}
                    onClick={() => handleDelete(page.id, pageTitle)}
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] disabled:opacity-40"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
              </div>

              {index < sortedPages.length - 1 && (
                <div className="mt-8 text-[var(--color-on-surface-variant)]">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </div>
              )}
            </div>
          )
        })}

        {/* Add page button */}
        {availableKinds.length > 0 && (
          <div className="relative mt-0 flex items-start">
            {sortedPages.length > 0 && (
              <div className="mt-8 mr-2 text-[var(--color-on-surface-variant)]">
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowAddMenu((v) => !v)}
                className="flex h-[104px] w-40 flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={20} />
                <span className="text-xs font-semibold">Agregar página</span>
              </button>
              {showAddMenu && (
                <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] py-1 shadow-lg">
                  {availableKinds.map((kind) => {
                    const Icon = KIND_ICONS[kind]
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => handleAdd(kind)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]"
                      >
                        <HugeiconsIcon icon={Icon} size={16} className="text-[var(--color-primary)]" />
                        {KIND_LABELS[kind]}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]">
          {error}
        </div>
      )}
    </div>
  )
}
