'use server'

import {
  updateContact as updateContactSvc,
  deleteContact as deleteContactAction,
} from '@/app/crm/contactos/actions'
import { addActivity } from '@/lib/services/contacts'

export async function updateContact(
  ...args: Parameters<typeof updateContactSvc>
) {
  return updateContactSvc(...args)
}

export async function deleteContact(
  ...args: Parameters<typeof deleteContactAction>
) {
  return deleteContactAction(...args)
}

type NoteState = { error: string } | null

export async function addNote(
  contactId: number,
  prevState: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'La nota no puede estar vacía' }

  const r = await addActivity(contactId, 'NOTE', body)
  if (!r.ok) {
    return { error: r.error.message }
  }
  return null
}
