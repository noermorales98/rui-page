import type { Flow, FlowRun, FlowStep, FlowStepAction, FlowTrigger, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getDefaultFromAddress, getMailerTransporter } from '@/lib/mailer'
import type { DispatchPayload, DispatchResult } from './types'
import { assertValidRedirectPosition, calculateRunSchedule, findMatchingFlows } from './triggers'

type FlowWithSteps = Flow & { steps: FlowStep[] }

function configObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function dispatch(trigger: FlowTrigger, payload: DispatchPayload): Promise<DispatchResult> {
  const flows = await findMatchingFlows(trigger, payload)
  const runIds: number[] = []
  let redirectUrl: string | undefined

  for (const flow of flows) {
    assertValidRedirectPosition(flow.steps)
    const run = await enqueueFlowRun(flow, payload)
    runIds.push(run.id)

    const first = flow.steps[0]
    if (first?.action === 'REDIRECT') {
      const cfg = configObject(first.config)
      const url = text(cfg.url)
      if (url) {
        redirectUrl = url
        await prisma.flowRunStep.updateMany({
          where: { runId: run.id, position: 0, status: 'PENDING' },
          data: {
            status: 'COMPLETED',
            executedAt: new Date(),
            result: { redirectUrl: url } as Prisma.InputJsonValue,
          },
        })
      }
    }
  }

  return { redirectUrl, runIds }
}

export async function enqueueFlowRun(flow: FlowWithSteps, payload: DispatchPayload): Promise<FlowRun> {
  const startedAt = new Date()
  const schedules = calculateRunSchedule(flow.steps, startedAt)
  return prisma.flowRun.create({
    data: {
      flowId: flow.id,
      contactId: payload.contactId ?? null,
      triggerPayload: payload as unknown as Prisma.InputJsonValue,
      status: 'PENDING',
      startedAt,
      steps: {
        create: flow.steps.map((step, index) => ({
          stepId: step.id,
          position: step.position,
          status: 'PENDING',
          runAt: schedules[index],
        })),
      },
    },
  })
}

export async function processPendingSteps(now = new Date()): Promise<{ processed: number; failed: number }> {
  const pending = await prisma.flowRunStep.findMany({
    where: { status: 'PENDING', runAt: { lte: now } },
    orderBy: { runAt: 'asc' },
    take: 50,
    include: {
      step: true,
      run: { include: { flow: true } },
    },
  })

  let processed = 0
  let failed = 0

  for (const item of pending) {
    const locked = await prisma.flowRunStep.updateMany({
      where: { id: item.id, status: 'PENDING' },
      data: { status: 'RUNNING' },
    })
    if (locked.count === 0) continue

    try {
      if (item.run.flow.status !== 'ACTIVE' || item.run.flow.deletedAt) {
        await completeStep(item.id, { skipped: true, reason: 'flow_not_active' })
      } else {
        const result = await executeStep(item.step.action, configObject(item.step.config), item.run)
        await completeStep(item.id, result)
      }
      processed++
      await completeRunIfDone(item.runId)
    } catch (error) {
      failed++
      await failOrRetryStep(item.id, item.attempts, error)
    }
  }

  return { processed, failed }
}

async function executeStep(
  action: FlowStepAction,
  config: Record<string, unknown>,
  run: FlowRun,
): Promise<Record<string, unknown>> {
  if (action === 'WAIT') return { waited: true }

  if (action === 'REDIRECT') {
    return { redirectUrl: text(config.url) ?? '/' }
  }

  if (!run.contactId) return { skipped: true, reason: 'missing_contact' }

  if (action === 'ASSIGN_TAG') {
    const tagId = numberValue(config.tagId)
    if (!tagId) return { skipped: true, reason: 'missing_tag' }
    await prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId: run.contactId, tagId } },
      update: {},
      create: { contactId: run.contactId, tagId },
    })
    return { tagId }
  }

  if (action === 'UPDATE_CONTACT_STATUS') {
    const status = text(config.status)
    if (!status || !['NEW', 'QUALIFIED', 'CLIENT'].includes(status)) {
      return { skipped: true, reason: 'invalid_status' }
    }
    await prisma.contact.update({ where: { id: run.contactId }, data: { status: status as 'NEW' | 'QUALIFIED' | 'CLIENT' } })
    return { status }
  }

  if (action === 'CREATE_DEAL') {
    const courseName = text(config.courseName) ?? 'Webinar'
    const stage = text(config.stage) ?? 'LEAD'
    const deal = await prisma.deal.create({
      data: {
        contactId: run.contactId,
        courseName,
        stage: ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED'].includes(stage)
          ? (stage as 'LEAD' | 'DEMO' | 'NEGOTIATION' | 'ENROLLED')
          : 'LEAD',
      },
    })
    return { dealId: deal.id }
  }

  if (action === 'MOVE_DEAL') {
    const courseName = text(config.courseName) ?? undefined
    const stage = text(config.stage) ?? 'LEAD'
    const normalizedStage = ['LEAD', 'DEMO', 'NEGOTIATION', 'ENROLLED'].includes(stage)
      ? (stage as 'LEAD' | 'DEMO' | 'NEGOTIATION' | 'ENROLLED')
      : 'LEAD'
    const existing = await prisma.deal.findFirst({
      where: { contactId: run.contactId, ...(courseName ? { courseName } : {}) },
      orderBy: { updatedAt: 'desc' },
    })
    const deal = existing
      ? await prisma.deal.update({ where: { id: existing.id }, data: { stage: normalizedStage } })
      : await prisma.deal.create({ data: { contactId: run.contactId, courseName, stage: normalizedStage } })
    return { dealId: deal.id, stage: normalizedStage }
  }

  if (action === 'SEND_EMAIL') {
    const subject = text(config.subject) ?? 'Mensaje de Rui'
    const bodyHtml = text(config.bodyHtml) ?? '<p>Gracias por registrarte.</p>'
    const contact = await prisma.contact.findUnique({ where: { id: run.contactId }, select: { email: true } })
    if (!contact?.email) return { skipped: true, reason: 'missing_email' }
    const transporter = getMailerTransporter()
    await transporter.sendMail({
      to: contact.email,
      from: getDefaultFromAddress(),
      subject,
      html: bodyHtml,
    })
    await prisma.contactActivity.create({
      data: { contactId: run.contactId, type: 'EMAIL_SENT', body: subject },
    })
    return { sent: true, subject }
  }

  if (action === 'SEND_WHATSAPP') {
    return { skipped: true, reason: 'whatsapp_future_action' }
  }

  return { skipped: true, reason: 'unsupported_action' }
}

async function completeStep(id: number, result: Record<string, unknown>) {
  await prisma.flowRunStep.update({
    where: { id },
    data: { status: 'COMPLETED', executedAt: new Date(), result: result as Prisma.InputJsonValue },
  })
}

async function failOrRetryStep(id: number, attempts: number, error: unknown) {
  const message = error instanceof Error ? error.message : 'Error inesperado'
  if (attempts < 3) {
    const backoff = [1, 5, 15][attempts] ?? 15
    await prisma.flowRunStep.update({
      where: { id },
      data: {
        status: 'PENDING',
        attempts: attempts + 1,
        runAt: new Date(Date.now() + backoff * 60_000),
        errorMessage: message,
      },
    })
    return
  }
  const step = await prisma.flowRunStep.update({
    where: { id },
    data: { status: 'FAILED', errorMessage: message },
    select: { runId: true },
  })
  await prisma.flowRun.update({
    where: { id: step.runId },
    data: { status: 'FAILED', errorMessage: message },
  })
}

async function completeRunIfDone(runId: number) {
  const remaining = await prisma.flowRunStep.count({
    where: { runId, status: { in: ['PENDING', 'RUNNING'] } },
  })
  if (remaining === 0) {
    await prisma.flowRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED', finishedAt: new Date() },
    })
  }
}
