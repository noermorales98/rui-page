import type { Role } from '@prisma/client'
import { auth } from '@/auth'

export type AuthErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN'

export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(code)
    this.name = 'AuthError'
  }
}

export async function requireSession() {
  const session = await auth()
  if (!session?.user) {
    throw new AuthError('UNAUTHORIZED')
  }
  return session
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession()
  if (!allowed.includes(session.user.role)) {
    throw new AuthError('FORBIDDEN')
  }
  return session
}
