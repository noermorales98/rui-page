import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { ViewToggle, type ListView } from '@/app/crm/_components/ui'
import { CreateFormModal } from './_components/CreateFormModal'
import { FormulariosTable } from './_components/FormulariosTable'
import { FormulariosGrid } from './_components/FormulariosGrid'
import { ViewToggle } from '@/app/crm/_components/ui'

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function FormulariosPage({ searchParams }: Props) {
  const params = await searchParams
  const view: ListView = params.view === 'cards' ? 'cards' : 'table'
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
        <div className="flex flex-wrap justify-end gap-2">
          <ViewToggle view={view} searchParams={params} />
          <CreateFormModal />
        </div>
      </div>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <FormulariosTable forms={forms} view={view} />
      </div>
    </div>
  )
}
