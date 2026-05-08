'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { RegistrationStatus } from '@prisma/client'

type State = { error: string } | null

const webinarSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
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
  } catch {
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
  } catch {
    return { error: 'Error al actualizar el webinar' }
  }

  revalidatePath('/crm/webinars')
  revalidatePath(`/crm/webinars/${id}`)
  return null
}

export async function deleteWebinar(id: number): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  await prisma.webinar.delete({ where: { id } })
  revalidatePath('/crm/webinars')
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
  } catch {
    return { error: 'El contacto ya está registrado en este webinar' }
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

  try {
    const contact = await prisma.contact.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {},
      create: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        source: 'WEBINAR',
      },
    })

    await prisma.webinarRegistration.upsert({
      where: { webinarId_contactId: { webinarId, contactId: contact.id } },
      update: {},
      create: { webinarId, contactId: contact.id, status: 'REGISTERED' },
    })
  } catch {
    return { error: 'Error al crear el contacto' }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  revalidatePath('/crm/contactos')
  return {}
}

export async function updateRegistrationStatus(
  registrationId: number,
  status: RegistrationStatus,
): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const updated = await prisma.webinarRegistration.update({
    where: { id: registrationId },
    data: { status },
  })

  revalidatePath(`/crm/webinars/${updated.webinarId}`)
}

export async function removeRegistration(registrationId: number): Promise<void> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

  const reg = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    select: { webinarId: true },
  })

  await prisma.webinarRegistration.delete({ where: { id: registrationId } })

  if (reg) revalidatePath(`/crm/webinars/${reg.webinarId}`)
}

export async function importRegistrations(
  webinarId: number,
  rows: { name: string; email: string }[],
): Promise<{ imported: number; skipped: number }> {
  const session = await auth()
  if (!session?.user) throw new Error('No autorizado')

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
    } catch {
      skipped++
    }
  }

  revalidatePath(`/crm/webinars/${webinarId}`)
  revalidatePath('/crm/contactos')
  return { imported, skipped }
}
