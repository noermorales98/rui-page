import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function FormResponsesPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const formId = Number(id)
  if (Number.isNaN(formId)) notFound()

  const page = Math.max(1, Number(query.page ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const [form, total, submissions] = await Promise.all([
    prisma.crmForm.findUnique({
      where: { id: formId },
      select: {
        id: true,
        name: true,
        fields: {
          orderBy: { position: 'asc' },
          select: { id: true, label: true, fieldKey: true },
        },
      },
    }),
    prisma.crmFormSubmission.count({ where: { formId } }),
    prisma.crmFormSubmission.findMany({
      where: { formId },
      skip,
      take: PAGE_SIZE,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        submittedAt: true,
        contact: { select: { id: true, name: true, email: true } },
        values: {
          select: { fieldId: true, rawValue: true },
        },
      },
    }),
  ])

  if (!form) notFound()

  return (
    <div>
      <Link
        href={`/crm/formularios/${form.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#8a8a8a] hover:text-[#080808]"
      >
        <ArrowLeft size={16} />
        {form.name}
      </Link>

      <div className="bg-[#f7f8fa] rounded-[28px] border border-[#e5e7eb] p-6">
        {submissions.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            No hay respuestas registradas.
          </div>
        ) : (
          <>
            <div
              className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8a8a8a]"
              style={{
                gridTemplateColumns: `1fr 1.5fr ${form.fields.map(() => '1fr').join(' ')}`,
              }}
            >
              <div>Fecha</div>
              <div>Contacto</div>
              {form.fields.map((field) => (
                <div key={field.id}>{field.label}</div>
              ))}
            </div>
            <div className="space-y-1.5">
              {submissions.map((submission) => {
                const values = new Map(submission.values.map((value) => [value.fieldId, value.rawValue]))
                return (
                  <div
                    key={submission.id}
                    className="grid items-center bg-white rounded-2xl px-4 py-3"
                    style={{
                      gridTemplateColumns: `1fr 1.5fr ${form.fields.map(() => '1fr').join(' ')}`,
                    }}
                  >
                    <div className="text-sm text-gray-500">
                      {formatDate(submission.submittedAt)}
                    </div>
                    <div className="text-sm">
                      {submission.contact ? (
                        <Link
                          href={`/crm/contactos/${submission.contact.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {submission.contact.name}
                          <span className="block text-xs font-normal text-gray-400">
                            {submission.contact.email}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-400">Sin contacto</span>
                      )}
                    </div>
                    {form.fields.map((field) => (
                      <div key={field.id} className="max-w-[260px] text-sm text-gray-700">
                        <span className="line-clamp-2">{values.get(field.id) || '-'}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/crm/formularios/${form.id}/respuestas?page=${page - 1}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-white"
              >
                Anterior
              </Link>
            )}
            {skip + PAGE_SIZE < total && (
              <Link
                href={`/crm/formularios/${form.id}/respuestas?page=${page + 1}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-white"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
