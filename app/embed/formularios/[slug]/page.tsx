import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FormRenderer } from '@/app/_components/forms/FormRenderer'
import { submitPublicForm } from '@/app/formularios/[slug]/actions'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/** Iframe-friendly: mismo envío que `/formularios/[slug]` (ver API_SPEC §3.3). */
export default async function EmbedFormularioPage({ params }: Props) {
  const { slug } = await params
  const form = await prisma.crmForm.findFirst({
    where: { slug, deletedAt: null },
    select: {
      name: true,
      slug: true,
      status: true,
      description: true,
      submitLabel: true,
      successMessage: true,
      fields: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          fieldKey: true,
          type: true,
          label: true,
          placeholder: true,
          helpText: true,
          isRequired: true,
          config: true,
        },
      },
    },
  })

  if (!form || form.status !== 'PUBLISHED') notFound()

  return (
    <main className="min-h-0 bg-transparent px-3 py-4 text-gray-900 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-xl">
        <FormRenderer
          title={form.name}
          description={form.description}
          fields={form.fields}
          submitLabel={form.submitLabel}
          successMessage={form.successMessage}
          action={submitPublicForm.bind(null, form.slug)}
        />
      </div>
    </main>
  )
}
