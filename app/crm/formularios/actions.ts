'use server'

import { revalidatePath } from 'next/cache'
import type { CrmFormFieldType, CrmFormStatus } from '@prisma/client'
import {
  addField as addFieldSvc,
  createForm as createFormSvc,
  removeField as removeFieldSvc,
  reorderFields as reorderFieldsSvc,
  setFormStatus as setFormStatusSvc,
  updateField as updateFieldSvc,
  updateForm as updateFormSvc,
} from '@/lib/services/forms'
import type { ApiError } from '@/lib/errors/map'
import { createFieldSchema } from '@/lib/validators/forms'
import { DEFAULT_FIELD_TEMPLATES, slugify } from './_lib/field-types'
import { prisma } from '@/lib/prisma'

type ActionState = { error: string } | null

function messageFor(error: ApiError): string {
  if (error.code === 'VALIDATION_ERROR') {
    const firstField = Object.entries(error.fields ?? {})[0]
    const firstMessage = firstField?.[1]?.[0]
    return firstMessage ?? error.message
  }
  return error.message
}

function nullableText(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || undefined
}

function revalidateFormPaths(formId: number, slug?: string) {
  revalidatePath('/crm/formularios')
  revalidatePath(`/crm/formularios/${formId}`)
  revalidatePath(`/crm/formularios/${formId}/respuestas`)
  if (slug) {
    revalidatePath(`/formularios/${slug}`)
    revalidatePath(`/embed/formularios/${slug}`)
  }
}

export async function createForm(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = nullableText(formData.get('name')) ?? ''
  const slug = slugify((formData.get('slug') as string) || name)

  const result = await createFormSvc({
    name,
    slug,
    description: nullableText(formData.get('description')),
    submitLabel: nullableText(formData.get('submitLabel')) ?? 'Enviar',
    successMessage: nullableText(formData.get('successMessage')) ?? 'Gracias, recibimos tus datos.',
  })

  if (!result.ok) {
    if (result.error.code === 'CONFLICT') return { error: 'Ya existe un formulario con ese slug' }
    return { error: messageFor(result.error) }
  }

  // Seed the form with the default field templates so users always land
  // in the builder with something to drag around.
  for (const tpl of DEFAULT_FIELD_TEMPLATES) {
    await addFieldSvc(result.data.id, {
      type: tpl.type,
      label: tpl.label,
      fieldKey: tpl.fieldKey,
      placeholder: tpl.placeholder,
      isRequired: tpl.isRequired,
      contactTarget: tpl.contactTarget,
    })
  }

  revalidatePath('/crm/formularios')
  return null
}

export async function updateFormSettings(
  formId: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const previous = await prisma.crmForm.findUnique({ where: { id: formId }, select: { slug: true } })

  const result = await updateFormSvc(formId, {
    name: nullableText(formData.get('name')),
    slug: slugify((formData.get('slug') as string) || ''),
    description: nullableText(formData.get('description')),
    submitLabel: nullableText(formData.get('submitLabel')),
    successMessage: nullableText(formData.get('successMessage')),
  })

  if (!result.ok) {
    if (result.error.code === 'CONFLICT') return { error: 'Ya existe un formulario con ese slug' }
    return { error: messageFor(result.error) }
  }

  revalidateFormPaths(formId, previous?.slug)
  if (result.data.slug !== previous?.slug) revalidatePath(`/formularios/${result.data.slug}`)
  return null
}

export async function addField(formId: number, raw: unknown): Promise<{ error?: string }> {
  const parsed = createFieldSchema.safeParse(raw)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const msg =
      Object.values(flat.fieldErrors).flat()[0] ??
      flat.formErrors[0] ??
      'Datos del campo inválidos'
    return { error: msg }
  }

  const result = await addFieldSvc(formId, parsed.data)
  if (!result.ok) return { error: messageFor(result.error) }

  const form = await prisma.crmForm.findUnique({ where: { id: formId }, select: { slug: true } })
  revalidateFormPaths(formId, form?.slug)
  return {}
}

export async function updateField(
  fieldId: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fieldConfigRaw = nullableText(formData.get('fieldConfig'))
  let config: unknown = undefined
  if (fieldConfigRaw !== undefined) {
    try {
      config = JSON.parse(fieldConfigRaw) as unknown
    } catch {
      return { error: 'La configuración JSON del campo no es válida' }
    }
  }

  const result = await updateFieldSvc(fieldId, {
    type: formData.get('type') as CrmFormFieldType,
    label: nullableText(formData.get('label')) ?? '',
    fieldKey: slugify((formData.get('fieldKey') as string) || ''),
    placeholder: nullableText(formData.get('placeholder')),
    helpText: nullableText(formData.get('helpText')),
    isRequired: formData.get('isRequired') === 'on',
    contactTarget: (formData.get('contactTarget') as string) || 'NONE',
    ...(config !== undefined ? { config } : {}),
  })
  if (!result.ok) {
    if (result.error.code === 'CONFLICT') return { error: 'Ya existe un campo con esa clave interna' }
    return { error: messageFor(result.error) }
  }

  const form = await prisma.crmForm.findUnique({
    where: { id: result.data.formId },
    select: { slug: true },
  })
  revalidateFormPaths(result.data.formId, form?.slug)
  return null
}

export async function deleteField(fieldId: number): Promise<{ error?: string }> {
  const result = await removeFieldSvc(fieldId)
  if (!result.ok) {
    if (result.error.code === 'NOT_FOUND') return {}
    return { error: messageFor(result.error) }
  }
  const form = await prisma.crmForm.findUnique({
    where: { id: result.data.formId },
    select: { slug: true },
  })
  revalidateFormPaths(result.data.formId, form?.slug)
  return {}
}

export async function moveField(
  fieldId: number,
  direction: 'up' | 'down',
): Promise<{ error?: string }> {
  // Translates the legacy up/down buttons into a reorderFields call so
  // every order change runs through the audited service path. T6 will
  // replace this with a single drag&drop interaction.
  const field = await prisma.crmFormField.findUnique({
    where: { id: fieldId },
    select: { formId: true },
  })
  if (!field) return { error: 'Campo no encontrado' }

  const fields = await prisma.crmFormField.findMany({
    where: { formId: field.formId },
    orderBy: { position: 'asc' },
    select: { id: true },
  })
  const ids = fields.map((f) => f.id)
  const idx = ids.indexOf(fieldId)
  if (idx === -1) return { error: 'Campo no encontrado' }

  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= ids.length) return {}
  ;[ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]]

  const result = await reorderFieldsSvc(field.formId, { orderedFieldIds: ids })
  if (!result.ok) return { error: messageFor(result.error) }

  const form = await prisma.crmForm.findUnique({ where: { id: field.formId }, select: { slug: true } })
  revalidateFormPaths(field.formId, form?.slug)
  return {}
}

export async function reorderFormFields(
  formId: number,
  orderedFieldIds: number[],
): Promise<{ error?: string }> {
  const result = await reorderFieldsSvc(formId, { orderedFieldIds })
  if (!result.ok) return { error: messageFor(result.error) }
  const form = await prisma.crmForm.findUnique({ where: { id: formId }, select: { slug: true } })
  revalidateFormPaths(formId, form?.slug)
  return {}
}

export async function setFormStatus(
  formId: number,
  status: CrmFormStatus,
): Promise<{ error?: string }> {
  const result = await setFormStatusSvc(formId, status)
  if (!result.ok) return { error: messageFor(result.error) }
  const form = await prisma.crmForm.findUnique({ where: { id: formId }, select: { slug: true } })
  revalidateFormPaths(formId, form?.slug)
  return {}
}
