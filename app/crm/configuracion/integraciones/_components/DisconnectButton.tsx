'use client'

import { useState, useTransition } from 'react'
import type { IntegrationProvider } from '@prisma/client'
import { disconnectIntegration } from '../actions'
import { Dialog } from '@/app/crm/_components/ui'

export function DisconnectButton({ provider }: { provider: IntegrationProvider }) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleClick() {
    setConfirmOpen(true)
  }

  function doDisconnect() {
    setConfirmOpen(false)
    startTransition(async () => {
      await disconnectIntegration(provider)
    })
  }

  return (
    <>
      <Dialog
        open={confirmOpen}
        title={`¿Desconectar ${provider}?`}
        description="Los webinars vinculados perderán su integración."
        variant="danger"
        confirmLabel="Desconectar"
        onConfirm={doDisconnect}
        onCancel={() => setConfirmOpen(false)}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {isPending ? 'Desconectando...' : 'Desconectar'}
      </button>
    </>
  )
}
