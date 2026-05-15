'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface ModalWrapperProps {
  onClose: () => void
  children: ReactNode
  title: string
}

export function ModalWrapper({ onClose, children, title }: ModalWrapperProps) {
  const titleId = title.toLowerCase().replace(/\s+/g, '-')

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overflow-x-hidden bg-[var(--color-overlay)] p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`my-auto max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto overflow-x-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-5 shadow-[var(--shadow-md)] sm:p-7`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 id={titleId} className={TOK.modalTitle}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className={TOK.closeIconBtn}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
