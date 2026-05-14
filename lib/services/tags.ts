'use server'

import type { Prisma, Tag } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { requireRole } from '@/lib/auth/permissions'
import { mapError, type ApiError } from '@/lib/errors/map'
import { createTagSchema, updateTagSchema } from '@/lib/validators/tags'

export type TagsServiceResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

export async function listTags(): Promise<TagsServiceResult<Tag[]>> {
  try {
    await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const tags = await prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return { ok: true, data: tags }
  } catch (e) {
    return mapError(e)
  }
}

/**
 * Crea o reutiliza etiquetas por nombre (p. ej. desde el formulario de contacto).
 * No escribe AuditLog por fila (operación auxiliar de alta frecuencia).
 */
export async function ensureTagsByNames(names: string[]): Promise<number[]> {
  await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  const ids: number[] = []
  for (const name of unique) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: { deletedAt: null },
      create: { name },
    })
    ids.push(tag.id)
  }
  return ids
}

/** Compatibilidad con acciones existentes: upsert por nombre + color opcional. */
export async function upsertTagByName(name: string, color?: string) {
  await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
  const trimmed = name.trim()
  if (!trimmed) return null

  return prisma.tag.upsert({
    where: { name: trimmed },
    update: {
      deletedAt: null,
      ...(color ? { color } : {}),
    },
    create: { name: trimmed, color: color ?? '#6366f1' },
  })
}

export async function createTag(raw: unknown): Promise<TagsServiceResult<Tag>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR', 'ASISTENTE'])
    const parsed = createTagSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      }
    }

    const tag = await prisma.tag.create({
      data: {
        name: parsed.data.name.trim(),
        color: parsed.data.color,
      },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Tag',
      entityId: tag.id,
      action: 'CREATE',
      metadata: { name: tag.name },
    })

    revalidatePath('/crm/contactos')
    return { ok: true, data: tag }
  } catch (e) {
    return mapError(e)
  }
}

export async function updateTag(
  id: unknown,
  raw: unknown,
): Promise<TagsServiceResult<Tag>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR'])
    const tagId =
      typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(tagId) || tagId < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' },
      }
    }

    const parsed = updateTagSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      }
    }

    const existing = await prisma.tag.findFirst({
      where: { id: tagId, deletedAt: null },
    })
    if (!existing) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {}
    if (parsed.data.name !== undefined && parsed.data.name !== existing.name) {
      changes.name = { from: existing.name, to: parsed.data.name.trim() }
    }
    if (parsed.data.color !== undefined && parsed.data.color !== existing.color) {
      changes.color = { from: existing.color, to: parsed.data.color }
    }

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(parsed.data.name !== undefined
          ? { name: parsed.data.name.trim() }
          : {}),
        ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
      },
    })

    if (Object.keys(changes).length > 0) {
      await logAudit({
        actorId: Number(session.user.id),
        entityType: 'Tag',
        entityId: tagId,
        action: 'UPDATE',
        changes: changes as Prisma.InputJsonValue,
      })
    }

    revalidatePath('/crm/contactos')
    return { ok: true, data: tag }
  } catch (e) {
    return mapError(e)
  }
}

export async function softDeleteTag(id: unknown): Promise<TagsServiceResult<{ id: number }>> {
  try {
    const session = await requireRole(['ADMIN', 'VENDEDOR'])
    const tagId =
      typeof id === 'string' || typeof id === 'number' ? Number(id) : NaN
    if (!Number.isInteger(tagId) || tagId < 1) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identificador inválido' },
      }
    }

    const existing = await prisma.tag.findFirst({
      where: { id: tagId, deletedAt: null },
    })
    if (!existing) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }

    await prisma.tag.update({
      where: { id: tagId },
      data: { deletedAt: new Date() },
    })

    await logAudit({
      actorId: Number(session.user.id),
      entityType: 'Tag',
      entityId: tagId,
      action: 'DELETE',
      metadata: { name: existing.name },
    })

    revalidatePath('/crm/contactos')
    return { ok: true, data: { id: tagId } }
  } catch (e) {
    return mapError(e)
  }
}
