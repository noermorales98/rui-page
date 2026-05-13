import type { ActivityType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function addActivity(
  contactId: number,
  type: ActivityType,
  body?: string | null,
  actorId?: number | null,
): Promise<void> {
  await prisma.contactActivity.create({
    data: {
      contactId,
      type,
      body: body ?? null,
      createdById: actorId ?? null,
    },
  })
}
