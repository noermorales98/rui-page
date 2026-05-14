'use client'

import React, { useId } from 'react'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: DialogProps): React.JSX.Element | null {
  const titleId = useId()

  if (!open) return null

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  const confirmClassName =
    variant === 'danger'
      ? 'rounded-full bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition focus-visible:outline-2 focus-visible:outline-[var(--color-primary-fixed)]'
      : 'rounded-full bg-[var(--color-on-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-surface-container-lowest)] hover:opacity-90 transition focus-visible:outline-2 focus-visible:outline-[var(--color-primary-fixed)]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-[calc(100vw-2rem)] max-w-sm rounded-[var(--radius-lg,20px)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--shadow-md,0_4px_14px_rgba(0,0,0,.30))]"
      >
        <h2
          id={titleId}
          className="text-base font-semibold text-[var(--color-on-surface)]"
        >
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
            {description}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-[var(--color-surface-container-high)] px-4 py-2 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)] transition focus-visible:outline-2 focus-visible:outline-[var(--color-primary-fixed)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={confirmClassName}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
