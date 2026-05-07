'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().nullish(),
  source: z.enum(['WEBINAR', 'FORM', 'MANUAL', 'IMPORT']),
  status: z.enum(['NEW', 'QUALIFIED', 'CLIENT']),
})

type ContactState = { error: string } | null

export async function createContact(
  prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || null,
    source: formData.get('source') as string,
    status: formData.get('status') as string,
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const tagIds = (formData.getAll('tagIds') as string[]).map(Number).filter(Boolean)
  const newTagNames = (formData.getAll('newTagNames') as string[]).filter(Boolean)

  // Upsert new tags and collect all tag IDs
  const upsertedTags = await Promise.all(
    newTagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )
  const allTagIds = [...tagIds, ...upsertedTags.map((t) => t.id)]

  try {
    await prisma.contact.create({
      data: {
        ...parsed.data,
        tags: {
          create: allTagIds.map((tagId) => ({ tagId })),
        },
      },
    })
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return { error: 'Este email ya está registrado' }
    }
    return { error: 'Error al crear el contacto' }
  }

  revalidatePath('/crm/contactos')
  return null
}

export async function updateContact(
  id: number,
  prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || null,
    source: formData.get('source') as string,
    status: formData.get('status') as string,
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const tagIds = (formData.getAll('tagIds') as string[]).map(Number).filter(Boolean)
  const newTagNames = (formData.getAll('newTagNames') as string[]).filter(Boolean)

  const upsertedTags = await Promise.all(
    newTagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )
  const allTagIds = [...tagIds, ...upsertedTags.map((t) => t.id)]

  try {
    await prisma.$transaction([
      prisma.contactTag.deleteMany({ where: { contactId: id } }),
      prisma.contact.update({
        where: { id },
        data: {
          ...parsed.data,
          tags: {
            create: allTagIds.map((tagId) => ({ tagId })),
          },
        },
      }),
    ])
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return { error: 'Este email ya está registrado' }
    }
    return { error: 'Error al actualizar el contacto' }
  }

  revalidatePath('/crm/contactos')
  revalidatePath(`/crm/contactos/${id}`)
  return null
}

export async function deleteContact(id: number, _formData?: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  try {
    await prisma.contact.delete({ where: { id } })
  } catch (err: unknown) {
    if (
      !(err !== null && typeof err === 'object' && 'code' in err &&
        (err as { code: string }).code === 'P2025')
    ) {
      throw err
    }
  }
  revalidatePath('/crm/contactos')
  redirect('/crm/contactos')
}

const importRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.enum(['WEBINAR', 'FORM', 'MANUAL', 'IMPORT']).optional(),
})

type ImportResult = { imported: number; skipped: number; errors: string[] }

export async function importContacts(
  prevState: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user) return { imported: 0, skipped: 0, errors: ['No autorizado'] }

  const rawRows = formData.get('rows') as string
  let rows: unknown[]
  try {
    rows = JSON.parse(rawRows)
  } catch {
    return { imported: 0, skipped: 0, errors: ['JSON inválido'] }
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const parsed = importRowSchema.safeParse(row)
    if (!parsed.success) {
      skipped++
      continue
    }
    const { name, email, phone, source } = parsed.data
    try {
      await prisma.contact.upsert({
        where: { email },
        update: { phone: phone ?? undefined, source: source ?? undefined },
        create: { name, email, phone, source: source ?? 'IMPORT' },
      })
      imported++
    } catch (err: unknown) {
      if (
        err !== null && typeof err === 'object' && 'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        // duplicate email — count as skipped
        errors.push(email)
        skipped++
      } else {
        throw err
      }
    }
  }

  revalidatePath('/crm/contactos')
  return { imported, skipped, errors }
}

export async function upsertTag(name: string, color?: string) {
  const session = await auth()
  if (!session?.user) return null

  return prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name, color: color ?? '#6366f1' },
  })
}
