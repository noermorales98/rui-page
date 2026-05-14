'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { IntegrationProvider } from '@prisma/client'

export async function disconnectIntegration(
  provider: IntegrationProvider,
): Promise<{ error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { error: 'No autorizado' }

  try {
    await prisma.integration.delete({ where: { provider } })
  } catch {
    // P2025 = not found — already disconnected, ignore
  }

  revalidatePath('/crm/configuracion/integraciones')
  return {}
}
