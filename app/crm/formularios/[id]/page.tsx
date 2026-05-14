import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { FormBuilder } from '../_components/FormBuilder'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FormularioBuilderPage({ params }: Props) {
  const { id } = await params
  const formId = Number(id)
  if (Number.isNaN(formId)) notFound()

  const form = await prisma.crmForm.findUnique({
    where: { id: formId },
    include: {
      fields: { orderBy: { position: 'asc' } },
      _count: { select: { submissions: true } },
    },
  })

  if (!form) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/formularios" className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Formularios
      </Link>

      <FormBuilder form={form} />
    </div>
  )
}
