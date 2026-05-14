import type { Role } from '@prisma/client'

/** Valores del enum `Role` en Prisma, con etiquetas para la UI. */
export const CRM_USER_ROLES: readonly { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'ASISTENTE', label: 'Asistente' },
]

export function labelForUserRole(role: Role): string {
  const found = CRM_USER_ROLES.find((r) => r.value === role)
  return found?.label ?? role
}
