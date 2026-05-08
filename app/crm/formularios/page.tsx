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
      <div className="flex justify-end">
        <CreateFormModal />
      </div>

      <div className="bg-[#f7f8fa] rounded-[28px] border border-[#e5e7eb] p-6">
        <FormulariosTable forms={forms} />
      </div>
    </div>
  )
}
