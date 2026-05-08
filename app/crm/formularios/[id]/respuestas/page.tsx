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

      <div className="mb-6">
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Respuestas</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} {total === 1 ? 'respuesta' : 'respuestas'}
        </p>
      </div>

      <div className="overflow-x-auto bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Fecha
              </th>
              <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Contacto
              </th>
              {form.fields.map((field) => (
                <th
                  key={field.id}
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {submissions.map((submission) => {
              const values = new Map(submission.values.map((value) => [value.fieldId, value.rawValue]))
              return (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(submission.submittedAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
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
                  </td>
                  {form.fields.map((field) => (
                    <td key={field.id} className="max-w-[260px] px-6 py-4 text-sm text-gray-700">
                      <span className="line-clamp-2">{values.get(field.id) || '-'}</span>
                    </td>
                  ))}
                </tr>
              )
            })}
            {submissions.length === 0 && (
              <tr>
                <td
                  colSpan={form.fields.length + 2}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No hay respuestas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
