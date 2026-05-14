import { Prisma } from '@prisma/client'
import { AuthError } from '@/lib/auth/permissions'

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export type ApiError = {
  code: ApiErrorCode
  message: string
  fields?: Record<string, string[]>
}

export function mapError(e: unknown): { ok: false; error: ApiError } {
  if (e instanceof AuthError) {
    const message =
      e.code === 'UNAUTHORIZED'
        ? 'Inicia sesión para continuar.'
        : 'No tienes permiso para esta acción.'
    return { ok: false, error: { code: e.code, message } }
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      return {
        ok: false,
        error: { code: 'CONFLICT', message: 'Ya existe un registro con esos datos.' },
      }
    }
    if (e.code === 'P2025') {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.' },
      }
    }
  }
  console.error('[mapError]', e)
  return {
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Algo salió mal. Intenta de nuevo.' },
  }
}
