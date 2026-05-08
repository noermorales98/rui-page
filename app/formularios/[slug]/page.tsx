import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FormRenderer } from '@/app/_components/forms/FormRenderer'
import { submitPublicForm } from './actions'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicFormularioPage({ params }: Props) {
  const { slug } = await params
  const form = await prisma.crmForm.findUnique({
    where: { slug },
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
        },
      },
    },
  })

  if (!form || form.status !== 'PUBLISHED') notFound()

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-900 sm:py-16">
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
