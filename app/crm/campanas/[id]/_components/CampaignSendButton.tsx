'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, RotateCcw } from 'lucide-react'
import { sendCampaign } from '@/app/crm/campanas/actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props {
  campaignId: number
  isRetry: boolean
}

export function CampaignSendButton({ campaignId, isRetry }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSend() {
    const label = isRetry ? 'reintentar el envío' : 'enviar esta campaña'
    if (!confirm(`¿Confirmas ${label}?`)) return
    startTransition(async () => {
      const result = await sendCampaign(campaignId)
      if (result?.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleSend}
      className={TOK.actionPrimary}
    >
      {isRetry ? <RotateCcw size={15} /> : <Send size={15} />}
      {pending ? 'Enviando...' : isRetry ? 'Reintentar' : 'Enviar campaña'}
    </button>
  )
}
