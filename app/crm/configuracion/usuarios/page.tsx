import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { deactivateUser } from './actions'
import { CreateUserModal } from './_components/CreateUserModal'
import { labelForUserRole } from './role-options'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default async function UsuariosPage() {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    redirect('/crm/configuracion')
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-end">
        <CreateUserModal />
      </div>

      {/* Table card */}
      <div className={`${TOK.panel} p-6`}>
        <table className="min-w-full border-separate border-spacing-y-1.5">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Fecha de creación
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const deactivateWithId = deactivateUser.bind(null, user.id)
              return (
                <tr key={user.id} className="bg-[var(--color-surface-container-lowest)] transition hover:bg-[var(--color-surface-container-low)]">
                  <td className="whitespace-nowrap rounded-l-[var(--radius-md)] px-6 py-4 text-sm font-medium text-[var(--color-on-surface)]">
                    {user.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">
                    <span
                      className={
                        user.role === 'ADMIN'
                          ? 'inline-flex items-center rounded-full bg-[var(--color-primary-fixed)] px-2 py-1 text-xs font-medium text-[var(--color-on-primary-fixed)]'
                          : user.role === 'VENDEDOR'
                            ? 'inline-flex items-center rounded-full bg-[var(--color-secondary-fixed)] px-2 py-1 text-xs font-medium text-[var(--color-on-secondary-fixed-variant)]'
                            : 'inline-flex items-center rounded-full bg-[var(--color-surface-container-high)] px-2 py-1 text-xs font-medium text-[var(--color-on-surface-variant)]'
                      }
                    >
                      {labelForUserRole(user.role)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-secondary-container)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-on-secondary-container)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-on-secondary-container)]" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-container-high)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-on-surface-variant)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-on-surface-variant)]" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-on-surface-variant)]">
                    {new Intl.DateTimeFormat('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(user.createdAt))}
                  </td>
                  <td className="whitespace-nowrap rounded-r-[var(--radius-md)] px-6 py-4 text-right text-sm">
                    {user.active && (
                      <form action={deactivateWithId}>
                        <button
                          type="submit"
                          className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] focus:outline-none"
                          title="Desactivar usuario"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-[var(--color-on-surface-variant)]"
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
