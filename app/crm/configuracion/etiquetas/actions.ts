'use server'

import {
  createTag as createTagService,
  softDeleteTag as softDeleteTagService,
  updateTag as updateTagService,
} from '@/lib/services/tags'

export type TagFormState = { error: string } | null

function readTagFormData(formData: FormData): { name: string; color: string } {
  return {
    name: ((formData.get('name') as string | null) ?? '').trim(),
    color: ((formData.get('color') as string | null) ?? '#6366f1').trim(),
  }
}

export async function createTag(
  _prev: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const result = await createTagService(readTagFormData(formData))
  if (!result.ok) return { error: result.error.message }
  return null
}

export async function updateTag(
  id: number,
  _prev: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  const result = await updateTagService(id, readTagFormData(formData))
  if (!result.ok) return { error: result.error.message }
  return null
}

export async function deleteTag(id: number, _formData?: FormData): Promise<void> {
  const result = await softDeleteTagService(id)
  if (!result.ok && result.error.code !== 'NOT_FOUND') {
    throw new Error(result.error.message)
  }
}
