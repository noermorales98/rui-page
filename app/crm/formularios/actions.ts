'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { DEFAULT_FIELD_TEMPLATES, slugify } from './_lib/field-types'
import type { CrmFormFieldType, CrmFormStatus } from '@prisma/client'

type ActionState = { error: string } | null

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  submitLabel: z.string().min(1, 'El texto del boton es obligatorio'),
  successMessage: z.string().min(1, 'El mensaje de exito es obligatorio'),
})

const fieldTypeSchema = z.enum([
  'SHORT_TEXT',
  'FULL_NAME',
  'PHONE',
  'PHONE_WITH_COUNTRY',
  'EMAIL',
  'CUSTOM_DATE',
  'CUSTOM_TIME',
  'CUSTOM_DATETIME',
])

const statusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

const fieldSchema = z.object({
  type: fieldTypeSchema,
  label: z.string().min(1, 'La etiqueta es obligatoria'),
  fieldKey: z.string().min(1, 'La clave interna es obligatoria'),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isRequired: z.boolean(),
  contactTarget: z.enum(['NONE', 'NAME', 'EMAIL', 'PHONE']),
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

async function getUniqueFieldKey(formId: number, baseKey: string) {
  const base = slugify(baseKey) || 'campo'
  const existing = await prisma.crmFormField.findMany({
    where: { formId, fieldKey: { startsWith: base } },
    select: { fieldKey: true },
  })
  const keys = new Set(existing.map((field) => field.fieldKey))

  if (!keys.has(base)) return base

  let index = 2
  while (keys.has(`${base}_${index}`)) index++
  return `${base}_${index}`
}

function revalidateFormPaths(formId: number, slug?: string) {
  revalidatePath('/crm/formularios')
  revalidatePath(`/crm/formularios/${formId}`)
  revalidatePath(`/crm/formularios/${formId}/respuestas`)
  if (slug) revalidatePath(`/formularios/${slug}`)
}

export async function createForm(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const name = nullableText(formData.get('name')) ?? ''
  const slug = slugify((formData.get('slug') as string) || name)

  const parsed = formSchema.safeParse({
    name,
    slug,
    description: nullableText(formData.get('description')),
    submitLabel: nullableText(formData.get('submitLabel')) ?? 'Enviar',
    successMessage: nullableText(formData.get('successMessage')) ?? 'Gracias, recibimos tus datos.',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  try {
    await prisma.crmForm.create({
      data: {
        ...parsed.data,
        description: parsed.data.description ?? null,
        createdById: Number(session.user.id),
        fields: {
          create: DEFAULT_FIELD_TEMPLATES.map((field, index) => ({
            type: field.type,
            label: field.label,
            fieldKey: field.fieldKey,
            placeholder: field.placeholder,
            contactTarget: field.contactTarget,
            isRequired: field.isRequired,
            position: index,
          })),
        },
      },
    })
  } catch (err: unknown) {
    if (err !== null && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'Ya existe un formulario con ese slug' }
    }
    return { error: 'Error al crear el formulario' }
  }

  revalidatePath('/crm/formularios')
  return null
}

export async function updateFormSettings(
  formId: number,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const previous = await prisma.crmForm.findUnique({
    where: { id: formId },
    select: { slug: true },
  })
  if (!previous) return { error: 'Formulario no encontrado' }

  const parsed = formSchema.safeParse({
    name: nullableText(formData.get('name')) ?? '',
    slug: slugify((formData.get('slug') as string) || ''),
    description: nullableText(formData.get('description')),
    submitLabel: nullableText(formData.get('submitLabel')) ?? 'Enviar',
    successMessage: nullableText(formData.get('successMessage')) ?? 'Gracias, recibimos tus datos.',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  try {
    await prisma.crmForm.update({
      where: { id: formId },
      data: {
        ...parsed.data,
        description: parsed.data.description ?? null,
      },
    })
  } catch (err: unknown) {
    if (err !== null && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'Ya existe un formulario con ese slug' }
    }
    return { error: 'Error al actualizar el formulario' }
  }

  revalidateFormPaths(formId, previous.slug)
  revalidatePath(`/formularios/${parsed.data.slug}`)
  return null
}

export async function addField(formId: number, type: CrmFormFieldType): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = fieldTypeSchema.safeParse(type)
  if (!parsed.success) return { error: 'Tipo de campo invalido' }

  const template = DEFAULT_FIELD_TEMPLATES.find((field) => field.type === parsed.data)
  if (!template) return { error: 'Tipo de campo invalido' }

  const form = await prisma.crmForm.findUnique({ where: { id: formId }, select: { slug: true } })
  if (!form) return { error: 'Formulario no encontrado' }

  const count = await prisma.crmFormField.count({ where: { formId } })
  const fieldKey = await getUniqueFieldKey(formId, template.fieldKey)

  await prisma.crmFormField.create({
    data: {
      formId,
      type: template.type,
      label: template.label,
      fieldKey,
      placeholder: template.placeholder,
      isRequired: template.isRequired,
      contactTarget: template.contactTarget,
      position: count,
    },
  })

  revalidateFormPaths(formId, form.slug)
  return {}
}

export async function updateField(
  fieldId: number,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = fieldSchema.safeParse({
    type: formData.get('type'),
    label: nullableText(formData.get('label')) ?? '',
    fieldKey: slugify((formData.get('fieldKey') as string) || ''),
    placeholder: nullableText(formData.get('placeholder')),
    helpText: nullableText(formData.get('helpText')),
    isRequired: formData.get('isRequired') === 'on',
    contactTarget: (formData.get('contactTarget') as string) || 'NONE',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }

  try {
    const field = await prisma.crmFormField.update({
      where: { id: fieldId },
      data: {
        ...parsed.data,
        placeholder: parsed.data.placeholder ?? null,
        helpText: parsed.data.helpText ?? null,
      },
      select: { formId: true, form: { select: { slug: true } } },
    })

    revalidateFormPaths(field.formId, field.form.slug)
  } catch (err: unknown) {
    if (err !== null && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'Ya existe un campo con esa clave interna' }
    }
    return { error: 'Error al actualizar el campo' }
  }

  return null
}

export async function deleteField(fieldId: number): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const field = await prisma.crmFormField.findUnique({
    where: { id: fieldId },
    select: { formId: true, position: true, form: { select: { slug: true } } },
  })
  if (!field) return {}

  await prisma.$transaction([
    prisma.crmFormField.delete({ where: { id: fieldId } }),
    prisma.crmFormField.updateMany({
      where: { formId: field.formId, position: { gt: field.position } },
      data: { position: { decrement: 1 } },
    }),
  ])

  revalidateFormPaths(field.formId, field.form.slug)
  return {}
}

export async function moveField(fieldId: number, direction: 'up' | 'down'): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const current = await prisma.crmFormField.findUnique({
    where: { id: fieldId },
    include: { form: { select: { slug: true } } },
  })
  if (!current) return { error: 'Campo no encontrado' }

  const sibling = await prisma.crmFormField.findFirst({
    where: {
      formId: current.formId,
      position: direction === 'up' ? { lt: current.position } : { gt: current.position },
    },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  })

  if (!sibling) return {}

  await prisma.$transaction([
    prisma.crmFormField.update({ where: { id: current.id }, data: { position: sibling.position } }),
    prisma.crmFormField.update({ where: { id: sibling.id }, data: { position: current.position } }),
  ])

  revalidateFormPaths(current.formId, current.form.slug)
  return {}
}

export async function setFormStatus(
  formId: number,
  status: CrmFormStatus,
): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = statusSchema.safeParse(status)
  if (!parsed.success) return { error: 'Estado invalido' }

  const form = await prisma.crmForm.findUnique({
    where: { id: formId },
    select: { slug: true, _count: { select: { fields: true } } },
  })
  if (!form) return { error: 'Formulario no encontrado' }
  if (parsed.data === 'PUBLISHED' && form._count.fields === 0) {
    return { error: 'Agrega al menos un campo antes de publicar' }
  }

  await prisma.crmForm.update({ where: { id: formId }, data: { status: parsed.data } })
  revalidateFormPaths(formId, form.slug)
  return {}
}
