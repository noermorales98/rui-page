'use client'

import type { ReactNode } from 'react'

interface ModalWrapperProps {
  onClose: () => void
  children: ReactNode
  title: string
}

export function ModalWrapper({ onClose, children, title }: ModalWrapperProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[28px] shadow-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#8a8a8a] hover:bg-[#e5e7eb] transition border-none cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
