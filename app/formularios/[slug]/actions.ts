'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { normalizeValue, validateFieldValue } from '@/app/crm/formularios/_lib/field-types'

type PublicFormState = {
  error?: string
  success?: boolean
  message?: string
} | null

function hashIp(value: string | null) {
  if (!value) return null
  return createHash('sha256').update(value).digest('hex').slice(0, 64)
}

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null
}

export async function submitPublicForm(
  slug: string,
  prevState: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const form = await prisma.crmForm.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      successMessage: true,
      fields: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          fieldKey: true,
          type: true,
          label: true,
          isRequired: true,
          contactTarget: true,
        },
      },
    },
  })

  if (!form || form.status !== 'PUBLISHED') {
    return { error: 'Este formulario no esta disponible' }
  }

  const values: { fieldId: number; rawValue: string | null; normalizedValue: string | null }[] = []
  const contactData: { name?: string; email?: string; phone?: string } = {}

  for (const field of form.fields) {
    const rawValue = String(formData.get(field.fieldKey) ?? '').trim()
    const error = validateFieldValue(field.type, rawValue, field.isRequired)
    if (error) return { error: `${field.label}: ${error}` }

    const normalizedValue = rawValue ? normalizeValue(field.type, rawValue) : ''

    if (field.contactTarget === 'NAME' && normalizedValue && !contactData.name) {
      contactData.name = rawValue
    }
    if (field.contactTarget === 'EMAIL' && normalizedValue && !contactData.email) {
      contactData.email = normalizedValue
    }
    if (field.contactTarget === 'PHONE' && normalizedValue && !contactData.phone) {
      contactData.phone = normalizedValue
    }

    values.push({
      fieldId: field.id,
      rawValue: rawValue || null,
      normalizedValue: normalizedValue || null,
    })
  }

  const headerStore = await headers()
  const userAgent = headerStore.get('user-agent')
  const ipHash = hashIp(
    firstHeaderValue(headerStore.get('x-forwarded-for')) ??
      headerStore.get('x-real-ip'),
  )

  await prisma.$transaction(async (tx) => {
    let contactId: number | null = null

    if (contactData.email) {
      const existing = await tx.contact.findUnique({
        where: { email: contactData.email },
        select: { id: true, name: true, phone: true },
      })

      if (existing) {
        const updateData: { name?: string; phone?: string; source?: 'FORM' } = {}
        if (!existing.name && contactData.name) updateData.name = contactData.name
        if (!existing.phone && contactData.phone) updateData.phone = contactData.phone
        if (Object.keys(updateData).length > 0) {
          await tx.contact.update({ where: { id: existing.id }, data: updateData })
        }
        contactId = existing.id
      } else {
        const contact = await tx.contact.create({
          data: {
            name: contactData.name || contactData.email,
            email: contactData.email,
            phone: contactData.phone ?? null,
            source: 'FORM',
          },
          select: { id: true },
        })
        contactId = contact.id
      }
    }

    const submission = await tx.crmFormSubmission.create({
      data: {
        formId: form.id,
        contactId,
        ipHash,
        userAgent,
      },
      select: { id: true },
    })

    if (values.length > 0) {
      await tx.crmFormSubmissionValue.createMany({
        data: values.map((value) => ({
          submissionId: submission.id,
          ...value,
        })),
      })
    }

    if (contactId) {
      await tx.contactActivity.create({
        data: {
          contactId,
          type: 'FORM_SUBMITTED',
          body: `Envio el formulario "${form.name}".`,
        },
      })
    }
  })

  revalidatePath('/crm/formularios')
  revalidatePath(`/crm/formularios/${form.id}`)
  revalidatePath(`/crm/formularios/${form.id}/respuestas`)
  revalidatePath('/crm/contactos')

  return {
    success: true,
    message: form.successMessage,
  }
}
