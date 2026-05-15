import type { Flow, FlowStep, FlowTrigger, Prisma } from '@prisma/client'
import type { DispatchPayload } from './types'

type FlowWithSteps = Flow & { steps: FlowStep[] }

export function matchesConfig(config: Prisma.JsonValue | null | undefined, payload: DispatchPayload): boolean {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return true
  const entries = Object.entries(config)
  if (entries.length === 0) return true

  return entries.every(([key, expected]) => {
    if (key === 'meta' || typeof expected === 'object') return true
    return payload[key as keyof DispatchPayload] === expected
  })
}

export function assertValidRedirectPosition(steps: Array<{ action: string; position: number }>) {
  const invalid = steps.find((step) => step.action === 'REDIRECT' && step.position !== 0)
  if (invalid) throw new Error('REDIRECT solo puede estar en la primera posicion del flow')
}

export function calculateRunSchedule(steps: Array<{ delayMins: number }>, start = new Date()): Date[] {
  let minutes = 0
  return steps.map((step) => {
    minutes += step.delayMins
    return new Date(start.getTime() + minutes * 60_000)
  })
}

export async function findMatchingFlows(
  trigger: FlowTrigger,
  payload: DispatchPayload,
): Promise<FlowWithSteps[]> {
  const { prisma } = await import('@/lib/prisma')
  const flows = await prisma.flow.findMany({
    where: { trigger, status: 'ACTIVE', deletedAt: null },
    include: { steps: { orderBy: { position: 'asc' } } },
  })
  return flows.filter((flow) => matchesConfig(flow.triggerConfig, payload))
}
