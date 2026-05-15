'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getCampaignFrom, getMailerTransporter, getMissingSmtpConfig } from '@/lib/mailer'
import { buildCampaignContactWhere, coerceCampaignFilters, formatCampaignAudience, normalizeCampaignFilters } from './_lib/segments'
import { renderCampaignEmail } from './_lib/email-template'
import type { CampaignFilters } from './_lib/segments'
import type { Prisma } from '@prisma/client'

type CampaignState = { error?: string; message?: string; campaignId?: number } | null
type PreviewState = {
  error?: string
  count?: number
  audienceLabel?: string
  sample?: { id: number; name: string; email: string; status: string; source: string }[]
} | null
type SendState = { error?: string; sent?: number; failed?: number; recipients?: number } | null

const campaignSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  subject: z.string().min(3, 'El asunto debe tener al menos 3 caracteres'),
  previewText: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.union([z.literal(''), z.string().email('Correo remitente invalido')]).optional(),
  bodyText: z.string().min(10, 'El contenido debe tener al menos 10 caracteres'),
})

async function requireSession() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

function nullableText(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || undefined
}

function filtersToJson(filters: CampaignFilters): Prisma.InputJsonValue {
  return filters as unknown as Prisma.InputJsonValue
}

async function resolveCampaignRecipients(filters: CampaignFilters, take?: number) {
  return prisma.contact.findMany({
    where: buildCampaignContactWhere(filters),
    take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      source: true,
      deals: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { courseName: true },
      },
    },
  })
}

export async function previewCampaignRecipients(
  _prevState: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const filters = normalizeCampaignFilters(formData)
  const where = buildCampaignContactWhere(filters)
  const [count, sample] = await Promise.all([
    prisma.contact.count({ where }),
    resolveCampaignRecipients(filters, 5),
  ])

  return {
    count,
    audienceLabel: formatCampaignAudience(filters),
    sample: sample.map((contact) => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      status: contact.status,
      source: contact.source,
    })),
  }
}

export async function createCampaign(
  _prevState: CampaignState,
  formData: FormData,
): Promise<CampaignState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = campaignSchema.safeParse({
    name: nullableText(formData.get('name')) ?? '',
    subject: nullableText(formData.get('subject')) ?? '',
    previewText: nullableText(formData.get('previewText')),
    fromName: nullableText(formData.get('fromName')),
    fromEmail: nullableText(formData.get('fromEmail')) ?? '',
    bodyText: nullableText(formData.get('bodyText')) ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  const filters = normalizeCampaignFilters(formData)
  const preview = renderCampaignEmail({
    subject: parsed.data.subject,
    previewText: parsed.data.previewText,
    bodyText: parsed.data.bodyText,
    contact: {
      name: '{{nombre}}',
      email: '{{email}}',
      phone: '{{telefono}}',
      projectName: '{{proyecto}}',
    },
  })

  try {
    const campaign = await prisma.crmCampaign.create({
      data: {
        name: parsed.data.name,
        subject: parsed.data.subject,
        previewText: parsed.data.previewText ?? null,
        fromName: parsed.data.fromName ?? null,
        fromEmail: parsed.data.fromEmail || null,
        bodyText: parsed.data.bodyText,
        bodyHtml: preview.html,
        filters: filtersToJson(filters),
        audienceLabel: formatCampaignAudience(filters),
        projectName: filters.projectQuery || null,
        createdById: Number(session.user.id),
      },
      select: { id: true },
    })

    revalidatePath('/crm/campanas')
    return { message: 'Campaña guardada como borrador', campaignId: campaign.id }
  } catch {
    return { error: 'Error al crear la campana' }
  }
}

export async function archiveCampaign(campaignId: number): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  await prisma.crmCampaign.update({
    where: { id: campaignId },
    data: { status: 'ARCHIVED' },
  })

  revalidatePath('/crm/campanas')
  return {}
}

export async function sendCampaign(campaignId: number): Promise<SendState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const missingConfig = getMissingSmtpConfig()
  if (missingConfig.length > 0) {
    return { error: `Faltan variables SMTP: ${missingConfig.join(', ')}` }
  }

  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
  })
  if (!campaign) return { error: 'Campaña no encontrada' }
  if (!['DRAFT', 'FAILED', 'PARTIAL'].includes(campaign.status)) {
    return { error: 'Esta campaña no se puede enviar en su estado actual' }
  }

  const filters = coerceCampaignFilters(campaign.filters)
  const contacts = await resolveCampaignRecipients(filters)
  if (contacts.length === 0) return { error: 'No hay destinatarios para esta campana' }

  await prisma.$transaction([
    prisma.crmCampaignRecipient.deleteMany({ where: { campaignId } }),
    prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENDING',
        recipientCount: contacts.length,
        sentCount: 0,
        failedCount: 0,
        sentAt: null,
      },
    }),
    prisma.crmCampaignRecipient.createMany({
      data: contacts.map((contact) => ({
        campaignId,
        contactId: contact.id,
        email: contact.email,
        name: contact.name,
        status: 'PENDING',
      })),
    }),
  ])

  const transporter = getMailerTransporter()
  const from = getCampaignFrom(campaign.fromName, campaign.fromEmail)
  let sent = 0
  let failed = 0
  const sentActivities: Prisma.ContactActivityCreateManyInput[] = []

  for (const contact of contacts) {
    const projectName = contact.deals[0]?.courseName ?? campaign.projectName
    const email = renderCampaignEmail({
      subject: campaign.subject,
      previewText: campaign.previewText,
      bodyText: campaign.bodyText ?? campaign.bodyHtml ?? '',
      contact: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        projectName,
      },
    })

    try {
      await transporter.sendMail({
        from,
        to: contact.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      })

      sent++
      await prisma.crmCampaignRecipient.updateMany({
        where: { campaignId, contactId: contact.id },
        data: { status: 'SENT', sentAt: new Date(), errorMessage: null },
      })
      sentActivities.push({
        contactId: contact.id,
        type: 'CAMPAIGN_SENT',
        body: `Campaña "${campaign.name}" enviada: ${campaign.subject}`,
        createdById: Number(session.user.id),
      })
    } catch (error) {
      failed++
      await prisma.crmCampaignRecipient.updateMany({
        where: { campaignId, contactId: contact.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        },
      })
    }
  }

  if (sentActivities.length > 0) {
    await prisma.contactActivity.createMany({ data: sentActivities })
  }

  const status = failed === 0 ? 'SENT' : sent === 0 ? 'FAILED' : 'PARTIAL'
  await prisma.crmCampaign.update({
    where: { id: campaignId },
    data: {
      status,
      sentCount: sent,
      failedCount: failed,
      sentAt: new Date(),
    },
  })

  revalidatePath('/crm/campanas')
  return { sent, failed, recipients: contacts.length }
}

// ── CampaignTemplate ────────────────────────────────────────

type TemplateState = { error?: string; message?: string; id?: number } | null

const templateSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  channel: z.enum(['EMAIL', 'WHATSAPP']),
  subject: z.string().optional(),
  previewText: z.string().optional(),
  bodyText: z.string().optional(),
  bodyHtml: z.string().optional(),
  waTemplate: z.string().optional(),
})

export async function createTemplate(
  _prevState: TemplateState,
  formData: FormData,
): Promise<TemplateState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = templateSchema.safeParse({
    name: formData.get('name'),
    channel: formData.get('channel'),
    subject: nullableText(formData.get('subject')),
    previewText: nullableText(formData.get('previewText')),
    bodyText: nullableText(formData.get('bodyText')),
    bodyHtml: nullableText(formData.get('bodyHtml')),
    waTemplate: nullableText(formData.get('waTemplate')),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const tmpl = await prisma.campaignTemplate.create({
      data: {
        ...parsed.data,
        subject: parsed.data.subject ?? null,
        previewText: parsed.data.previewText ?? null,
        bodyText: parsed.data.bodyText ?? null,
        bodyHtml: parsed.data.bodyHtml ?? null,
        waTemplate: parsed.data.waTemplate ?? null,
        createdById: Number(session.user.id),
      },
      select: { id: true },
    })
    revalidatePath('/crm/campanas/templates')
    return { message: 'Plantilla creada', id: tmpl.id }
  } catch {
    return { error: 'Error al crear la plantilla' }
  }
}

export async function updateTemplate(
  templateId: number,
  _prevState: TemplateState,
  formData: FormData,
): Promise<TemplateState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = templateSchema.safeParse({
    name: formData.get('name'),
    channel: formData.get('channel'),
    subject: nullableText(formData.get('subject')),
    previewText: nullableText(formData.get('previewText')),
    bodyText: nullableText(formData.get('bodyText')),
    bodyHtml: nullableText(formData.get('bodyHtml')),
    waTemplate: nullableText(formData.get('waTemplate')),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    await prisma.campaignTemplate.update({
      where: { id: templateId },
      data: {
        ...parsed.data,
        subject: parsed.data.subject ?? null,
        previewText: parsed.data.previewText ?? null,
        bodyText: parsed.data.bodyText ?? null,
        bodyHtml: parsed.data.bodyHtml ?? null,
        waTemplate: parsed.data.waTemplate ?? null,
      },
    })
    revalidatePath('/crm/campanas/templates')
    revalidatePath(`/crm/campanas/templates/${templateId}`)
    return { message: 'Plantilla actualizada' }
  } catch {
    return { error: 'Error al actualizar la plantilla' }
  }
}

export async function deleteTemplate(templateId: number): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  try {
    await prisma.campaignTemplate.update({
      where: { id: templateId },
      data: { deletedAt: new Date() },
    })
    revalidatePath('/crm/campanas/templates')
  } catch {
    return { error: 'Error al eliminar la plantilla' }
  }
  return {}
}

// ── Segment ─────────────────────────────────────────────────

type SegmentState = { error?: string; message?: string; id?: number } | null

const segmentSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  isDynamic: z.coerce.boolean().default(true),
  filters: z.string().min(2, 'Los filtros son requeridos'),
})

export async function createSegment(
  _prevState: SegmentState,
  formData: FormData,
): Promise<SegmentState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = segmentSchema.safeParse({
    name: formData.get('name'),
    description: nullableText(formData.get('description')),
    isDynamic: formData.get('isDynamic') !== 'false',
    filters: formData.get('filters'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  let filtersJson: unknown
  try {
    filtersJson = JSON.parse(parsed.data.filters)
  } catch {
    return { error: 'Los filtros no son JSON válido' }
  }

  try {
    const seg = await prisma.segment.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        isDynamic: parsed.data.isDynamic,
        filters: filtersJson as Parameters<typeof prisma.segment.create>[0]['data']['filters'],
        createdById: Number(session.user.id),
      },
      select: { id: true },
    })
    revalidatePath('/crm/campanas/segmentos')
    return { message: 'Segmento creado', id: seg.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Unique constraint')) return { error: 'Ya existe un segmento con ese nombre' }
    return { error: 'Error al crear el segmento' }
  }
}

export async function updateSegment(
  segmentId: number,
  _prevState: SegmentState,
  formData: FormData,
): Promise<SegmentState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = segmentSchema.safeParse({
    name: formData.get('name'),
    description: nullableText(formData.get('description')),
    isDynamic: formData.get('isDynamic') !== 'false',
    filters: formData.get('filters'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  let filtersJson: unknown
  try {
    filtersJson = JSON.parse(parsed.data.filters)
  } catch {
    return { error: 'Los filtros no son JSON válido' }
  }

  try {
    await prisma.segment.update({
      where: { id: segmentId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        isDynamic: parsed.data.isDynamic,
        filters: filtersJson as Parameters<typeof prisma.segment.update>[0]['data']['filters'],
      },
    })
    revalidatePath('/crm/campanas/segmentos')
    revalidatePath(`/crm/campanas/segmentos/${segmentId}`)
    return { message: 'Segmento actualizado' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Unique constraint')) return { error: 'Ya existe un segmento con ese nombre' }
    return { error: 'Error al actualizar el segmento' }
  }
}

export async function deleteSegment(segmentId: number): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  try {
    await prisma.segment.update({
      where: { id: segmentId },
      data: { deletedAt: new Date() },
    })
    revalidatePath('/crm/campanas/segmentos')
  } catch {
    return { error: 'Error al eliminar el segmento' }
  }
  return {}
}

export async function previewSegmentRecipients(
  segmentId: number,
): Promise<{ error?: string; count?: number; sample?: { id: number; name: string; email: string }[] }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, deletedAt: null },
    select: { filters: true },
  })
  if (!segment) return { error: 'Segmento no encontrado' }

  const { buildSegmentWhere } = await import('@/lib/segments/evaluator')
  const where = { ...buildSegmentWhere(segment.filters), deletedAt: null }

  const [count, sample] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      select: { id: true, name: true, email: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { count, sample }
}
