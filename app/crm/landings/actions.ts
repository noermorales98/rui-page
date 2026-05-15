'use server'

import { redirect } from 'next/navigation'
import type { FunnelStatus } from '@prisma/client'
import {
  createWebinarFunnel,
  saveFunnelPageBlocks,
  saveFunnelPageHtml,
  saveFunnelAutomation,
  setFunnelStatus,
  updateFunnelTheme,
} from '@/lib/services/funnels'
import { defaultTheme } from '@/lib/funnels/defaults'

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
