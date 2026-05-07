'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  updateContact as _updateContact,
  deleteContact as _deleteContact,
} from '@/app/crm/contactos/actions'

export async function updateContact(
  ...args: Parameters<typeof _updateContact>
) {
  return _updateContact(...args)
}

export async function deleteContact(
  ...args: Parameters<typeof _deleteContact>
) {
  return _deleteContact(...args)
}

type NoteState = { error: string } | null

export async function addNote(
  contactId: number,
  prevState: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'La nota no puede estar vacía' }

  await prisma.contactActivity.create({
    data: {
      contactId,
      type: 'NOTE',
      body,
      createdById: Number(session.user.id),
    },
  })

  revalidatePath(`/crm/contactos/${contactId}`)
  return null
}
