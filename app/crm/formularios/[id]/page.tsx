import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
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
    <div>
      <Link
        href="/crm/formularios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        Formularios
      </Link>

      <FormBuilder form={form} />
    </div>
  )
}
