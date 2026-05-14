'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { RegistrationStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type State = { error: string } | null

const webinarSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  date: z.string().min(1, 'La fecha es requerida').refine(
    (s) => !Number.isNaN(Date.parse(s)),
    'La fecha no es válida',
  ),
  platform: z.string().optional(),
  link: z.string().optional(),
  description: z.string().optional(),
})

export async function createWebinar(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const parsed = webinarSchema.safeParse({
    title: formData.get('title'),
    date: formData.get('date'),
    platform: (formData.get('platform') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await prisma.webinar.create({
      data: {
        title: parsed.data.title,
        date: new Date(parsed.data.date),
        platform: parsed.data.platform ?? null,
        link: parsed.data.link ?? null,
        description: parsed.data.description ?? null,
      },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Error al crear el webinar' }
  }

  revalidatePath('/crm/webinars')
  return null
}

export async function updateWebinar(
  id: number,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const parsed = webinarSchema.safeParse({
    title: formData.get('title'),
    date: formData.get('date'),
    platform: (formData.get('platform') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await prisma.webinar.update({
      where: { id },
      data: {
        title: parsed.data.title,
        date: new Date(parsed.data.date),
        platform: parsed.data.platform ?? null,
        link: parsed.data.link ?? null,
        description: parsed.data.description ?? null,
      },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Error al actualizar el webinar' }
  }

  revalidatePath('/crm/webinars')
  revalidatePath(`/crm/webinars/${id}`)
  return null
}

export async function deleteWebinar(id: number): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    await prisma.webinar.delete({ where: { id } })
  } catch (e) {
    console.error(e)
    return { error: 'Error al eliminar el webinar' }
  }
  revalidatePath('/crm/webinars')
  return {}
}

export async function addRegistration(
  webinarId: number,
  contactId: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    await prisma.webinarRegistration.create({
      data: { webinarId, contactId, status: 'REGISTERED' },
    })
  } catch (e) {
    console.error(e)
    const code = (e as Prisma.PrismaClientKnownRequestError)?.code
    return { error: code === 'P2002' ? 'El contacto ya está registrado en este webinar' : 'Error al registrar' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}

export async function createAndRegister(
  webinarId: number,
  name: string,
  email: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  let contact: { id: number }
  try {
    contact = await prisma.contact.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {},
      create: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        source: 'WEBINAR',
      },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Error al crear el contacto' }
  }

  try {
    await prisma.webinarRegistration.upsert({
      where: { webinarId_contactId: { webinarId, contactId: contact.id } },
      update: {},
      create: { webinarId, contactId: contact.id, status: 'REGISTERED' },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Error al registrar' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  revalidatePath('/crm/contactos')
  return {}
}

export async function updateRegistrationStatus(
  registrationId: number,
  status: RegistrationStatus,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    const updated = await prisma.webinarRegistration.update({
      where: { id: registrationId },
      data: { status },
    })
    revalidatePath(`/crm/webinars/${updated.webinarId}`)
  } catch (e) {
    console.error(e)
    return { error: 'Error al actualizar el estado' }
  }
  return {}
}

export async function removeRegistration(registrationId: number): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    const reg = await prisma.webinarRegistration.delete({
      where: { id: registrationId },
      select: { webinarId: true },
    })
    revalidatePath(`/crm/webinars/${reg.webinarId}`)
  } catch (e) {
    console.error(e)
    const code = (e as Prisma.PrismaClientKnownRequestError)?.code
    if (code !== 'P2025') return { error: 'Error al eliminar el registro' }
    // P2025 = record not found — already gone, silently succeed
  }
  return {}
}

export async function importRegistrations(
  webinarId: number,
  rows: { name: string; email: string }[],
): Promise<{ imported: number; skipped: number; error?: string }> {
  const session = await auth()
  if (!session?.user) return { imported: 0, skipped: 0, error: 'No autorizado' }

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.email?.trim()) {
      skipped++
      continue
    }

    try {
      const contact = await prisma.contact.upsert({
        where: { email: row.email.trim().toLowerCase() },
        update: {},
        create: {
          name: row.name?.trim() || row.email.trim(),
          email: row.email.trim().toLowerCase(),
          source: 'WEBINAR',
        },
      })

      await prisma.webinarRegistration.upsert({
        where: { webinarId_contactId: { webinarId, contactId: contact.id } },
        update: {},
        create: { webinarId, contactId: contact.id, status: 'REGISTERED' },
      })

      imported++
    } catch (e) {
      console.error(e)
      skipped++
    }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  revalidatePath('/crm/contactos')
  return { imported, skipped }
}

export async function linkZoomWebinar(
  webinarId: number,
  zoomWebinarId: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const externalId = zoomWebinarId.trim()
  if (!externalId) return { error: 'El ID de Zoom es obligatorio' }

  const zoomIntegration = await prisma.integration.findUnique({ where: { provider: 'ZOOM' } })
  if (!zoomIntegration) return { error: 'Zoom no está conectado' }

  try {
    await prisma.webinarIntegration.upsert({
      where: { webinarId },
      create: {
        webinarId,
        integrationId: zoomIntegration.id,
        externalId,
      },
      update: { externalId },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Error al vincular el webinar' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}

export async function unlinkZoomWebinar(webinarId: number): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  try {
    await prisma.webinarIntegration.delete({ where: { webinarId } })
  } catch {
    // P2025: Already unlinked — ignore
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}

export async function updateViewerCount(
  webinarId: number,
  viewerCount: number,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  if (!Number.isInteger(viewerCount) || viewerCount < 0) {
    return { error: 'Número inválido' }
  }

  try {
    await prisma.webinar.update({ where: { id: webinarId }, data: { viewerCount } })
  } catch (e) {
    console.error(e)
    return { error: 'Error al actualizar métricas' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  return {}
}
