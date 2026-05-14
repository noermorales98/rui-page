'use client'

import { useCallback } from 'react'

type ToastFn = (message: string) => void

export function useToast(): { success: ToastFn; error: ToastFn; info: ToastFn } {
  const show = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    // Dispatch a custom event that a ToastProvider (if present) can listen to.
    // Falls back to console when no provider is mounted.
    const event = new CustomEvent('crm:toast', { detail: { message, type } })
    const dispatched = window.dispatchEvent(event)
    if (!dispatched) {
      // eslint-disable-next-line no-console
      console.warn(`[toast:${type}]`, message)
    }
  }, [])

  return {
    success: useCallback((msg) => show(msg, 'success'), [show]),
    error: useCallback((msg) => show(msg, 'error'), [show]),
    info: useCallback((msg) => show(msg, 'info'), [show]),
  }
}
