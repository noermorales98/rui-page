'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalWrapperProps {
  onClose: () => void
  children: ReactNode
  title: string
}

export function ModalWrapper({ onClose, children, title }: ModalWrapperProps) {
  const titleId = title.toLowerCase().replace(/\s+/g, '-')

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overflow-x-hidden bg-black/40 p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="my-auto max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto overflow-x-hidden rounded-[28px] bg-white p-5 sm:p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[#f0f1f3] text-[#8a8a8a] transition hover:bg-[#e5e7eb] hover:text-[#080808] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
