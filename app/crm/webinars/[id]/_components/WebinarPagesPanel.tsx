'use client'

import { useState } from 'react'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type PageLink = {
  label: string
  description: string
  href: string
}

interface Props {
  pages: PageLink[]
}

function PageRow({ label, description, href }: PageLink) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${href}`
      : href
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">{label}</p>
        <p className="mt-0.5 font-mono text-xs text-[var(--color-on-surface-variant)]">{href}</p>
        <p className="mt-0.5 text-xs text-[var(--color-on-surface-variant)]">{description}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={copy}
          className={TOK.actionSecondary}
          title="Copiar URL"
        >
          {copied ? 'Copiado ✓' : 'Copiar'}
        </button>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={TOK.actionSecondary}
        >
          Ver
        </a>
      </div>
    </div>
  )
}

export function WebinarPagesPanel({ pages }: Props) {
  if (pages.length === 0) {
    return (
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        No hay páginas configuradas para este webinar.
      </p>
    )
  }

  return (
    <div className={`${TOK.panel} p-5 space-y-3`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
        Páginas públicas
      </h3>
      <div className="space-y-2">
        {pages.map((p) => (
          <PageRow key={p.href} {...p} />
        ))}
      </div>
    </div>
  )
}
