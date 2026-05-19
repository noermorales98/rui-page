'use server'

import { redirect } from 'next/navigation'
import type { FunnelStatus, FunnelPageKind, FlowStepAction } from '@prisma/client'
import {
  createWebinarFunnel,
  createFunnelLinkedToWebinar,
  saveFunnelPageBlocks,
  saveFunnelPageHtml,
  saveFunnelAutomation,
  setFunnelStatus,
  updateFunnelTheme,
  addFunnelPage,
  deleteFunnelPage,
} from '@/lib/services/funnels'
import { prisma } from '@/lib/prisma'
import { defaultTheme } from '@/lib/funnels/defaults'
import { listForms, getForm } from '@/lib/services/forms'
import type { FormCacheEntry } from '@/lib/funnels/types'

type ActionState = { error: string } | null

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function createWebinarFunnelAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await createWebinarFunnel({
    name: text(formData, 'name'),
    slug: text(formData, 'slug'),
    webinarTitle: text(formData, 'webinarTitle'),
    webinarDate: text(formData, 'webinarDate'),
    platform: text(formData, 'platform'),
    webinarUrl: text(formData, 'webinarUrl'),
    description: text(formData, 'description'),
    categories: text(formData, 'categories'),
  })

  if (!result.ok) return { error: result.error.message }
  redirect(`/crm/landings/${result.data.id}`)
}

export async function createFunnelLinkedToWebinarAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await createFunnelLinkedToWebinar({
    name: text(formData, 'name'),
    slug: text(formData, 'slug'),
    webinarId: text(formData, 'webinarId'),
  })
  if (!result.ok) return { error: result.error.message }
  redirect(`/crm/landings/${result.data.id}`)
}

export async function listWebinarsAction(): Promise<
  { id: number; title: string; date: string; link: string | null }[]
> {
  const webinars = await prisma.webinar.findMany({
    where: { deletedAt: null },
    orderBy: { date: 'desc' },
    select: { id: true, title: true, date: true, link: true },
  })
  return webinars.map((w) => ({
    id: w.id,
    title: w.title,
    date: w.date.toISOString(),
    link: w.link,
  }))
}

export async function updateThemeAction(
  funnelId: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await updateFunnelTheme(funnelId, {
    font: text(formData, 'font') || defaultTheme.font,
    backgroundColor: text(formData, 'backgroundColor') || defaultTheme.backgroundColor,
    surfaceColor: text(formData, 'surfaceColor') || defaultTheme.surfaceColor,
    textColor: text(formData, 'textColor') || defaultTheme.textColor,
    mutedTextColor: text(formData, 'mutedTextColor') || defaultTheme.mutedTextColor,
    accentColor: text(formData, 'accentColor') || defaultTheme.accentColor,
    buttonStyle: text(formData, 'buttonStyle') || defaultTheme.buttonStyle,
    radius: text(formData, 'radius') || defaultTheme.radius,
  })
  return result.ok ? null : { error: result.error.message }
}

export async function saveBlocksAction(
  pageId: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = text(formData, 'blocks')
  try {
    const blocks = JSON.parse(raw)
    const result = await saveFunnelPageBlocks(pageId, { blocks })
    return result.ok ? null : { error: result.error.message }
  } catch {
    return { error: 'El JSON de bloques no es válido' }
  }
}

export async function saveHtmlAction(
  pageId: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await saveFunnelPageHtml(pageId, {
    customHtml: text(formData, 'customHtml'),
    customCss: text(formData, 'customCss'),
  })
  return result.ok ? null : { error: result.error.message }
}

export async function setStatusAction(
  funnelId: number,
  status: FunnelStatus,
): Promise<{ error?: string }> {
  const result = await setFunnelStatus(funnelId, status)
  return result.ok ? {} : { error: result.error.message }
}

export async function saveAutomationAction(
  funnelId: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const steps = JSON.parse(text(formData, 'steps'))
    const result = await saveFunnelAutomation(funnelId, {
      trigger: (text(formData, 'trigger') || 'LANDING_SUBMITTED') as 'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED',
      status: (text(formData, 'status') || 'DRAFT') as 'DRAFT' | 'ACTIVE' | 'PAUSED',
      steps,
    })
    return result.ok ? null : { error: result.error.message }
  } catch {
    return { error: 'El JSON de pasos no es válido' }
  }
}

export async function listPublishedFormsAction(): Promise<
  { id: number; name: string; slug: string; fieldCount: number }[]
> {
  const result = await listForms()
  if (!result.ok) return []
  return result.data
    .filter((f) => f.status === 'PUBLISHED')
    .map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      fieldCount: f._count.fields,
    }))
}

export async function getFormDetailAction(formId: number): Promise<FormCacheEntry | null> {
  const result = await getForm(formId)
  if (!result.ok) return null
  const f = result.data
  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    submitLabel: f.submitLabel,
    successMessage: f.successMessage,
    fields: f.fields.map((field) => ({
      id: field.id,
      label: field.label,
      fieldKey: field.fieldKey,
      type: field.type,
      placeholder: field.placeholder,
      isRequired: field.isRequired,
    })),
  }
}

export async function addFunnelPageAction(
  funnelId: number,
  kind: FunnelPageKind,
): Promise<{ error?: string }> {
  const result = await addFunnelPage(funnelId, kind)
  return result.ok ? {} : { error: result.error.message }
}

export async function deleteFunnelPageAction(pageId: number): Promise<{ error?: string }> {
  const result = await deleteFunnelPage(pageId)
  return result.ok ? {} : { error: result.error.message }
}

export async function saveFlowAction(
  funnelId: number,
  trigger: 'LANDING_SUBMITTED' | 'WEBINAR_REGISTERED',
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED',
  steps: Array<{ action: string; delayMins: number; config: Record<string, unknown> }>,
): Promise<{ error?: string }> {
  const result = await saveFunnelAutomation(funnelId, {
    trigger,
    status,
    steps: steps as Array<{ action: FlowStepAction; delayMins: number; config: Record<string, unknown> }>,
  })
  return result.ok ? {} : { error: result.error.message }
}
