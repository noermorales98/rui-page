import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CreateTagModal } from './_components/CreateTagModal'
import { EditTagRow } from './_components/EditTagRow'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default async function EtiquetasPage() {
  const session = await auth()
  const role = session?.user?.role

  if (role !== 'ADMIN' && role !== 'VENDEDOR') {
    redirect('/crm/configuracion')
  }

  const tags = await prisma.tag.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          contacts: { where: { contact: { deletedAt: null } } },
        },
      },
    },
  })

  const canDelete = role === 'ADMIN' || role === 'VENDEDOR'

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <CreateTagModal />
      </div>

      <div className={`${TOK.panel} p-6`}>
        <table className="min-w-full border-separate border-spacing-y-1.5">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                En uso
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <EditTagRow
                key={tag.id}
                tag={tag}
                usage={tag._count.contacts}
                canDelete={canDelete}
              />
            ))}

            {tags.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-[var(--color-on-surface-variant)]">
                  No hay etiquetas. Crea la primera arriba a la derecha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
