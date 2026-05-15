import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { TemplateForm } from '../_components/TemplateForm'
import { DeleteTemplateButton } from '../_components/DeleteTemplateButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params
  const templateId = Number(id)
  if (!Number.isInteger(templateId) || templateId < 1) notFound()

  const template = await prisma.campaignTemplate.findFirst({
    where: { id: templateId, deletedAt: null },
    select: { id: true, name: true, channel: true, subject: true, previewText: true, bodyText: true, waTemplate: true },
  })
  if (!template) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/campanas/templates" className={TOK.linkBack}>
        <ArrowLeft size={16} />
        Plantillas
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">{template.name}</h1>
        <DeleteTemplateButton templateId={template.id} />
      </div>
      <TemplateForm template={template} />
    </div>
  )
}
