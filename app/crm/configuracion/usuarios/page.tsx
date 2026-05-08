import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { deactivateUser } from './actions'
import { CreateUserModal } from './_components/CreateUserModal'

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
      <div className="bg-[#f7f8fa] rounded-[28px] border border-[#e5e7eb] p-6 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Fecha de creación
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((user) => {
              const deactivateWithId = deactivateUser.bind(null, user.id)
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {user.role === 'ADMIN' ? (
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 border border-[#9bbdf7]/30">
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                        Editor
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Intl.DateTimeFormat('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(user.createdAt))}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {user.active && (
                      <form action={deactivateWithId}>
                        <button
                          type="submit"
                          className="text-gray-400 hover:text-red-600 focus:outline-none"
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
                  className="px-6 py-12 text-center text-sm text-gray-500"
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
