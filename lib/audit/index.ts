import type { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type LogParams = {
  actorId: number | null
  entityType: string
  entityId: number
  action: AuditAction
  changes?: Prisma.InputJsonValue
  metadata?: Prisma.InputJsonValue
}

export async function logAudit(p: LogParams): Promise<void> {
  await prisma.auditLog.create({ data: p })
}
