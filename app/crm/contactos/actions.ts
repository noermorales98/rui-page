'use server'

import { redirect } from 'next/navigation'
import {
  createContact as createContactSvc,
  importContactsCsv,
  importContactsCsvFromBuffer,
  softDeleteContact,
  updateContact as updateContactSvc,
} from '@/lib/services/contacts'
import { upsertTagByName } from '@/lib/services/tags'

type ContactState = { error: string } | null

function formTagIds(formData: FormData): number[] {
  return (formData.getAll('tagIds') as string[]).map(Number).filter((n) => Number.isInteger(n) && n > 0)
}

function formNewTagNames(formData: FormData): string[] {
  return (formData.getAll('newTagNames') as string[]).map((s) => s.trim()).filter(Boolean)
}

export async function createContact(
  prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    source: formData.get('source') as string,
    status: formData.get('status') as string,
  }

  const r = await createContactSvc(raw, {
    tagIds: formTagIds(formData),
    newTagNames: formNewTagNames(formData),
  })

  if (!r.ok) {
    return { error: r.error.message }
  }
  return null
}

export async function updateContact(
  id: number,
  prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    source: formData.get('source') as string,
    status: formData.get('status') as string,
  }

  const r = await updateContactSvc(id, raw, {
    tagIds: formTagIds(formData),
    newTagNames: formNewTagNames(formData),
  })

  if (!r.ok) {
    return { error: r.error.message }
  }
  return null
}

export async function deleteContact(id: number, formData?: FormData): Promise<void> {
  void formData
  const r = await softDeleteContact(id)
  if (!r.ok) {
    throw new Error(r.error.message)
  }
  redirect('/crm/contactos')
}

export type ImportContactsState = {
  inserted: number
  updated: number
  errors: Array<{ row: number; message: string }>
} | null

/** Importación enviando el CSV como archivo (parseo en servidor con csv-parse). */
export async function importContactsFile(
  prevState: ImportContactsState,
  formData: FormData,
): Promise<ImportContactsState> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return {
      inserted: 0,
      updated: 0,
      errors: [{ row: 0, message: 'Selecciona un archivo CSV' }],
    }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const r = await importContactsCsvFromBuffer(buf)
  if (!r.ok) {
    return {
      inserted: 0,
      updated: 0,
      errors: [{ row: 0, message: r.error.message }],
    }
  }
  return r.data
}

/** Importación desde JSON de filas (p. ej. pruebas o integraciones). */
export async function importContacts(
  prevState: ImportContactsState,
  formData: FormData,
): Promise<ImportContactsState> {
  const rawRows = formData.get('rows') as string
  let rows: unknown[]
  try {
    rows = JSON.parse(rawRows)
  } catch {
    return { inserted: 0, updated: 0, errors: [{ row: 0, message: 'JSON inválido' }] }
  }

  const r = await importContactsCsv(rows)
  if (!r.ok) {
    return { inserted: 0, updated: 0, errors: [{ row: 0, message: r.error.message }] }
  }
  return r.data
}

export async function upsertTag(name: string, color?: string) {
  return upsertTagByName(name, color)
}
