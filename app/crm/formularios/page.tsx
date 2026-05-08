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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Formularios</h1>
          <p className="mt-1.5 text-sm text-[#8a8a8a]">Crea formularios y captura leads al CRM.</p>
        </div>
        <CreateFormModal />
      </div>

      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        <FormulariosTable forms={forms} />
      </div>
    </div>
  )
}
