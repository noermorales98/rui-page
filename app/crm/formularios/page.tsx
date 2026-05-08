import { prisma } from '@/lib/prisma'
import { CreateFormModal } from './_components/CreateFormModal'
import { FormulariosTable } from './_components/FormulariosTable'

export default async function FormulariosPage() {
  const forms = await prisma.crmForm.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      _count: { select: { fields: true, submissions: true } },
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
        select: { submittedAt: true },
      },
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formularios</h1>
          <p className="mt-1 text-sm text-gray-500">Crea formularios y captura leads al CRM.</p>
        </div>
        <CreateFormModal />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <FormulariosTable forms={forms} />
      </div>
    </div>
  )
}
