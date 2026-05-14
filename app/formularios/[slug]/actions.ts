'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { hashIpForSubmit, submitForm } from '@/lib/services/forms'

type PublicFormState = {
  error?: string
  success?: boolean
  message?: string
} | null

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null
}

export async function submitPublicForm(
  slug: string,
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value
  }

  const headerStore = await headers()
  const ipHash = await hashIpForSubmit(
    firstHeaderValue(headerStore.get('x-forwarded-for')) ?? headerStore.get('x-real-ip'),
  )
  const userAgent = headerStore.get('user-agent')

  const result = await submitForm(slug, values, { ipHash, userAgent })
  if (!result.ok) {
    return { error: result.error.message }
  }

  revalidatePath('/crm/formularios')
  revalidatePath('/crm/contactos')

  return { success: true, message: result.data.successMessage }
}
