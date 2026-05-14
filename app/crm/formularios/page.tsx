import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Formularios</h1>
          <p className={`mt-1.5 ${TOK.sectionSubtitle}`}>
            Formularios publicos, campos personalizados y respuestas enlazadas a contactos.
          </p>
        </div>
        <CreateFormModal />
      </div>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <FormulariosTable forms={forms} />
      </div>
    </div>
  )
}
