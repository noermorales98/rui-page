'use client'

import { useTransition } from 'react'
import type { IntegrationProvider } from '@prisma/client'
import { disconnectIntegration } from '../actions'

export function DisconnectButton({ provider }: { provider: IntegrationProvider }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`¿Desconectar ${provider}? Los webinars vinculados perderán su integración.`)) return
    startTransition(async () => {
      await disconnectIntegration(provider)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
    >
      {isPending ? 'Desconectando...' : 'Desconectar'}
    </button>
  )
}
