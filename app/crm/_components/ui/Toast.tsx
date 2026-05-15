'use client'

import React, { createContext, useCallback, useRef, useState } from 'react'

interface ToastItem {
  id: number
  message: string
  variant: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  add: (message: string, variant: ToastItem['variant']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const add = useCallback((message: string, variant: ToastItem['variant']) => {
    const id = ++nextId.current
    setToasts((prev) => [...prev, { id, message, variant }])
    const timer = setTimeout(() => {
      timers.current.delete(id)
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
    timers.current.set(id, timer)
  }, [])

  function dismiss(id: number) {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const variantClass: Record<ToastItem['variant'], string> = {
    success:
      'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]',
    error:
      'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]',
    info: 'bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]',
  }

  return (
    <ToastContext.Provider value={{ add }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end"
        aria-live="polite"
        aria-label="Notificaciones"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex max-w-xs items-start gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium shadow-[var(--shadow-md)] ${variantClass[toast.variant]}`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => dismiss(toast.id)}
              className="ml-1 leading-none opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
} {
  const ctx = React.use(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }

  return {
    success: (msg: string) => ctx.add(msg, 'success'),
    error: (msg: string) => ctx.add(msg, 'error'),
    info: (msg: string) => ctx.add(msg, 'info'),
  }
}
