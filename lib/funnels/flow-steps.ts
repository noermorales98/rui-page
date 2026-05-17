export type EmailStep   = { id: string; type: 'email';   subject: string; body: string }
export type WaitStep    = { id: string; type: 'wait';    amount: number; unit: 'hours' | 'days' }
export type TagStep     = { id: string; type: 'tag';     tag: string }
export type WebhookStep = { id: string; type: 'webhook'; url: string; method: 'POST' | 'GET' }
export type VisualStep  = EmailStep | WaitStep | TagStep | WebhookStep

type ServiceStep = { action: string; delayMins: number; config: Record<string, unknown> }

export function visualStepsToService(steps: VisualStep[]): ServiceStep[] {
  return steps.map((step) => {
    if (step.type === 'email') {
      return { action: 'SEND_EMAIL', delayMins: 0, config: { subject: step.subject, body: step.body } }
    }
    if (step.type === 'wait') {
      const delayMins = step.unit === 'hours' ? step.amount * 60 : step.amount * 1440
      return { action: 'WAIT', delayMins, config: {} }
    }
    if (step.type === 'tag') {
      return { action: 'ASSIGN_TAG', delayMins: 0, config: { tagName: step.tag } }
    }
    return { action: 'SEND_WEBHOOK', delayMins: 0, config: { url: step.url, method: step.method } }
  })
}

export function serviceStepsToVisual(steps: ServiceStep[]): VisualStep[] {
  const result: VisualStep[] = []
  for (const step of steps) {
    const id = crypto.randomUUID()
    if (step.action === 'SEND_EMAIL') {
      result.push({ id, type: 'email', subject: String(step.config.subject ?? ''), body: String(step.config.body ?? '') })
    } else if (step.action === 'WAIT') {
      const mins = step.delayMins
      if (mins >= 1440 && mins % 1440 === 0) {
        result.push({ id, type: 'wait', amount: mins / 1440, unit: 'days' })
      } else {
        result.push({ id, type: 'wait', amount: Math.round(mins / 60) || 1, unit: 'hours' })
      }
    } else if (step.action === 'ASSIGN_TAG') {
      result.push({ id, type: 'tag', tag: String(step.config.tagName ?? '') })
    } else if (step.action === 'SEND_WEBHOOK') {
      const method = step.config.method === 'GET' ? 'GET' : 'POST'
      result.push({ id, type: 'webhook', url: String(step.config.url ?? ''), method })
    }
    // Unsupported actions are silently skipped
  }
  return result
}
