'use server'

import { revalidatePath } from 'next/cache'
import type { FlowStepAction, FlowTrigger, FunnelPageKind, FunnelStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/permissions'
import { mapError, type ApiError } from '@/lib/errors/map'
import { logAudit } from '@/lib/audit'
import { defaultTheme, defaultWebinarPages, pageKindDefaults } from '@/lib/funnels/defaults'
import { canPublishFunnel, normalizeCategoryNames } from '@/lib/funnels/rules'
import { publicFunnelUrl, slugifyFunnel } from '@/lib/funnels/slug'
import { sanitizeCss, sanitizeHtml } from '@/lib/funnels/sanitize'
import {
  createWebinarFunnelSchema,
  registerForFunnelSchema,
  saveBlocksSchema,
  saveHtmlSchema,
  saveThemeSchema,
} from '@/lib/validators/funnels'

type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError }

const LANDING_ROLES = ['ADMIN', 'VENDEDOR'] as const
const READ_ROLES = ['ADMIN', 'VENDEDOR', 'ASISTENTE'] as const

function validationError(message: string): Result<never> {
  return { ok: false, error: { code: 'VALIDATION_ERROR', message } }
}

function revalidateFunnel(slug?: string) {
  revalidatePath('/crm/landings')
  if (slug) {
    revalidatePath(`/f/${slug}`)
    revalidatePath(`/f/${slug}/gracias`)
    revalidatePath(`/f/${slug}/acceso`)
    revalidatePath(`/f/${slug}/sala`)
  }
}

export async function listFunnels() {
  await requireRole([...READ_ROLES])
  return prisma.funnel.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      webinar: { select: { title: true, date: true } },
      pages: { select: { id: true } },
      categories: { include: { category: true } },
    },
  })
}

export async function getFunnelForStudio(id: number) {
  await requireRole([...READ_ROLES])
  return prisma.funnel.findFirst({
    where: { id, deletedAt: null },
    include: {
      webinar: true,
      pages: { orderBy: { position: 'asc' } },
      categories: { include: { category: true } },
    },
  })
}

export async function listFunnelAutomations(funnelId: number) {
  await requireRole([...READ_ROLES])
  return prisma.flow.findMany({
    where: { name: `Funnel ${funnelId} automation`, deletedAt: null },
    include: { steps: { orderBy: { position: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createWebinarFunnel(input: unknown): Promise<Result<{ id: number; slug: string }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const parsed = createWebinarFunnelSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return validationError(message)
    }

    const slug = slugifyFunnel(parsed.data.slug || parsed.data.name)
    const categories = normalizeCategoryNames(parsed.data.categories)
    const theme = parsed.data.theme ?? defaultTheme
    const pages = defaultWebinarPages(slug)

    const funnel = await prisma.$transaction(async (tx) => {
      const webinar = await tx.webinar.create({
        data: {
          title: parsed.data.webinarTitle,
          date: new Date(parsed.data.webinarDate),
          platform: parsed.data.platform || null,
          link: parsed.data.webinarUrl || null,
          description: parsed.data.description || null,
        },
      })

      const created = await tx.funnel.create({
        data: {
          name: parsed.data.name,
          slug,
          type: 'WEBINAR',
          status: 'DRAFT',
          theme: theme as unknown as Prisma.InputJsonValue,
          webinarId: webinar.id,
          createdById: Number(session.user.id),
          pages: {
            create: pages.map((page) => ({
              key: page.key,
              kind: page.kind,
              slug: page.slug,
              title: page.title,
              description: page.description,
              position: page.position,
              blocks: page.blocks as unknown as Prisma.InputJsonValue,
            })),
          },
        },
      })

      for (const name of categories) {
        const category = await tx.funnelCategory.upsert({
          where: { name },
          update: {},
          create: { name },
        })
        await tx.funnelCategoryOnFunnel.create({
          data: { funnelId: created.id, categoryId: category.id },
        })
      }

      return created
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Funnel',
      entityId: funnel.id,
      action: 'CREATE',
      metadata: { type: 'WEBINAR' },
    })

    revalidateFunnel(funnel.slug)
    return { ok: true, data: { id: funnel.id, slug: funnel.slug } }
  } catch (error) {
    return mapError(error)
  }
}

export async function updateFunnelTheme(funnelId: number, input: unknown): Promise<Result<{ id: number }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const parsed = saveThemeSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Tema inválido')

    const funnel = await prisma.funnel.update({
      where: { id: funnelId },
      data: { theme: parsed.data as unknown as Prisma.InputJsonValue },
      select: { id: true, slug: true },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Funnel',
      entityId: funnel.id,
      action: 'UPDATE',
      changes: { theme: true },
    })
    revalidateFunnel(funnel.slug)
    return { ok: true, data: { id: funnel.id } }
  } catch (error) {
    return mapError(error)
  }
}

export async function saveFunnelPageBlocks(
  pageId: number,
  input: unknown,
): Promise<Result<{ funnelId: number }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const parsed = saveBlocksSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Bloques inválidos')

    const page = await prisma.funnelPage.update({
      where: { id: pageId },
      data: {
        mode: 'VISUAL',
        blocks: parsed.data.blocks as unknown as Prisma.InputJsonValue,
      },
      select: { funnelId: true, funnel: { select: { slug: true } } },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Funnel',
      entityId: page.funnelId,
      action: 'UPDATE',
      metadata: { pageId, mode: 'VISUAL' },
    })
    revalidateFunnel(page.funnel.slug)
    return { ok: true, data: { funnelId: page.funnelId } }
  } catch (error) {
    return mapError(error)
  }
}

export async function saveFunnelPageHtml(
  pageId: number,
  input: unknown,
): Promise<Result<{ funnelId: number }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const parsed = saveHtmlSchema.safeParse(input)
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'HTML inválido')

    const page = await prisma.funnelPage.update({
      where: { id: pageId },
      data: {
        mode: 'HTML',
        customHtml: sanitizeHtml(parsed.data.customHtml),
        customCss: sanitizeCss(parsed.data.customCss ?? ''),
      },
      select: { funnelId: true, funnel: { select: { slug: true } } },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Funnel',
      entityId: page.funnelId,
      action: 'UPDATE',
      metadata: { pageId, mode: 'HTML' },
    })
    revalidateFunnel(page.funnel.slug)
    return { ok: true, data: { funnelId: page.funnelId } }
  } catch (error) {
    return mapError(error)
  }
}

export async function setFunnelStatus(
  funnelId: number,
  status: FunnelStatus,
): Promise<Result<{ id: number; status: FunnelStatus }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const current = await prisma.funnel.findUnique({
      where: { id: funnelId },
      select: {
        id: true,
        status: true,
        slug: true,
        pages: { select: { key: true } },
      },
    })
    if (!current) return { ok: false, error: { code: 'NOT_FOUND', message: 'Funnel no encontrado.' } }

    if (status === 'PUBLISHED') {
      const publishable = canPublishFunnel(current.pages)
      if (!publishable.ok) return validationError(publishable.error)
    }

    const funnel = await prisma.funnel.update({
      where: { id: funnelId },
      data: { status },
      select: { id: true, slug: true, status: true },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Funnel',
      entityId: funnel.id,
      action: 'STATUS_CHANGE',
      changes: { status: { from: current.status, to: funnel.status } },
    })
    revalidateFunnel(funnel.slug)
    return { ok: true, data: { id: funnel.id, status: funnel.status } }
  } catch (error) {
    return mapError(error)
  }
}

export async function saveFunnelAutomation(
  funnelId: number,
  input: {
    trigger: FlowTrigger
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED'
    steps: Array<{ action: FlowStepAction; delayMins: number; config: Record<string, unknown> }>
  },
): Promise<Result<{ id: number }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const funnel = await prisma.funnel.findUnique({ where: { id: funnelId }, select: { id: true, slug: true } })
    if (!funnel) return { ok: false, error: { code: 'NOT_FOUND', message: 'Funnel no encontrado.' } }

    if (!['LANDING_SUBMITTED', 'WEBINAR_REGISTERED'].includes(input.trigger)) {
      return validationError('Trigger no permitido para funnels.')
    }
    if (input.steps.some((step, index) => step.action === 'REDIRECT' && index !== 0)) {
      return validationError('REDIRECT solo puede ser el primer paso.')
    }
    if (input.steps.some((step) => step.action === 'SEND_WHATSAPP')) {
      return validationError('WhatsApp estara disponible en una fase futura.')
    }

    const flow = await prisma.$transaction(async (tx) => {
      const existing = await tx.flow.findFirst({
        where: { name: `Funnel ${funnelId} automation`, deletedAt: null },
        select: { id: true },
      })

      if (existing) {
        await tx.flowStep.deleteMany({ where: { flowId: existing.id } })
        return tx.flow.update({
          where: { id: existing.id },
          data: {
            trigger: input.trigger,
            triggerConfig: { funnelId },
            status: input.status,
            steps: {
              create: input.steps.map((step, index) => ({
                action: step.action,
                position: index,
                delayMins: Math.max(0, Number(step.delayMins) || 0),
                config: step.config as Prisma.InputJsonValue,
              })),
            },
          },
        })
      }

      return tx.flow.create({
        data: {
          name: `Funnel ${funnelId} automation`,
          description: 'Automatizacion inicial del funnel.',
          trigger: input.trigger,
          triggerConfig: { funnelId },
          status: input.status,
          createdById: Number(session.user.id),
          steps: {
            create: input.steps.map((step, index) => ({
              action: step.action,
              position: index,
              delayMins: Math.max(0, Number(step.delayMins) || 0),
              config: step.config as Prisma.InputJsonValue,
            })),
          },
        },
      })
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Flow',
      entityId: flow.id,
      action: 'UPDATE',
      metadata: { funnelId },
    })
    revalidateFunnel(funnel.slug)
    return { ok: true, data: { id: flow.id } }
  } catch (error) {
    return mapError(error)
  }
}

export async function addFunnelPage(
  funnelId: number,
  kind: FunnelPageKind,
): Promise<Result<{ id: number }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, deletedAt: null },
      select: { id: true, slug: true, pages: { select: { kind: true, position: true } } },
    })
    if (!funnel) return { ok: false, error: { code: 'NOT_FOUND', message: 'Funnel no encontrado.' } }

    const alreadyExists = funnel.pages.some((p) => p.kind === kind)
    if (alreadyExists) return validationError(`Ya existe una página de tipo ${kind}.`)

    const defaults = pageKindDefaults(kind)
    const maxPosition = funnel.pages.reduce((max, p) => Math.max(max, p.position), -1)

    const page = await prisma.funnelPage.create({
      data: {
        funnelId,
        kind,
        key: defaults.key,
        slug: defaults.slug,
        title: defaults.title,
        position: maxPosition + 1,
        blocks: [] as Prisma.InputJsonValue,
      },
    })
    revalidateFunnel(funnel.slug)
    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'FunnelPage',
      entityId: page.id,
      action: 'CREATE',
      metadata: { kind, funnelId },
    })
    return { ok: true, data: { id: page.id } }
  } catch (error) {
    return mapError(error)
  }
}

export async function deleteFunnelPage(pageId: number): Promise<Result<{ id: number }>> {
  try {
    const session = await requireRole([...LANDING_ROLES])
    const page = await prisma.funnelPage.findUnique({
      where: { id: pageId },
      select: { id: true, funnelId: true, funnel: { select: { slug: true, pages: { select: { id: true } } } } },
    })
    if (!page) return { ok: false, error: { code: 'NOT_FOUND', message: 'Página no encontrada.' } }
    if (page.funnel.pages.length <= 1) return validationError('No puedes eliminar la única página del funnel.')

    await prisma.funnelPage.delete({ where: { id: pageId } })
    revalidateFunnel(page.funnel.slug)
    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'FunnelPage',
      entityId: pageId,
      action: 'DELETE',
      metadata: { funnelId: page.funnelId },
    })
    return { ok: true, data: { id: pageId } }
  } catch (error) {
    return mapError(error)
  }
}

export async function registerForFunnel(
  slug: string,
  input: unknown,
): Promise<Result<{ redirectUrl: string; contactId: number }>> {
  const parsed = registerForFunnelSchema.safeParse(input)
  if (!parsed.success) return validationError(parsed.error.issues[0]?.message ?? 'Datos inválidos')

  try {
    const funnel = await prisma.funnel.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: {
        webinar: true,
        pages: { select: { key: true } },
      },
    })
    if (!funnel) return { ok: false, error: { code: 'NOT_FOUND', message: 'Funnel no encontrado.' } }

    const contact = await prisma.$transaction(async (tx) => {
      const savedContact = await tx.contact.upsert({
        where: { email: parsed.data.email },
        update: {
          name: parsed.data.name,
          phone: parsed.data.phone || null,
        },
        create: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          source: 'WEBINAR',
        },
      })

      await tx.contactActivity.create({
        data: {
          contactId: savedContact.id,
          type: 'FORM_SUBMITTED',
          body: `Registro enviado desde ${funnel.name}.`,
        },
      })

      if (funnel.webinarId) {
        await tx.webinarRegistration.upsert({
          where: { webinarId_contactId: { webinarId: funnel.webinarId, contactId: savedContact.id } },
          update: {},
          create: { webinarId: funnel.webinarId, contactId: savedContact.id, status: 'REGISTERED' },
        })
        await tx.contactActivity.create({
          data: {
            contactId: savedContact.id,
            type: 'WEBINAR_REGISTERED',
            body: `Registro al webinar ${funnel.webinar?.title ?? funnel.name}.`,
          },
        })
      }

      return savedContact
    })

    const { dispatch } = await import('@/lib/flows/engine')
    const landingDispatch = await dispatch('LANDING_SUBMITTED', {
      contactId: contact.id,
      funnelId: funnel.id,
      webinarId: funnel.webinarId ?? undefined,
      meta: { slug: funnel.slug },
    })
    const webinarDispatch = funnel.webinarId
      ? await dispatch('WEBINAR_REGISTERED', {
          contactId: contact.id,
          funnelId: funnel.id,
          webinarId: funnel.webinarId,
          meta: { slug: funnel.slug },
        })
      : { redirectUrl: undefined }

    return {
      ok: true,
      data: {
        contactId: contact.id,
        redirectUrl:
          landingDispatch.redirectUrl ??
          webinarDispatch.redirectUrl ??
          publicFunnelUrl(funnel.slug, 'thank_you', 'gracias'),
      },
    }
  } catch (error) {
    return mapError(error)
  }
}
