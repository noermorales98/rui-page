import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'

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

  const gridTemplateColumns = `1fr 1.5fr ${form.fields.map(() => '1fr').join(' ')}`
  const rowSurface =
    'grid items-center gap-3 rounded-2xl bg-[var(--color-surface-container-lowest)] px-4 py-3'

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/crm/formularios/${form.id}`} className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        {form.name}
      </Link>

      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Respuestas</h1>
        <p className={`mt-1.5 ${TOK.sectionSubtitle}`}>
          {total === 0
            ? 'Aun no hay envios registrados.'
            : `${total} envio${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        {submissions.length === 0 ? (
          <div className={TOK.emptyState}>
            <p className={TOK.textStrong}>Sin respuestas</p>
            <p className={`mt-1 ${TOK.textMuted}`}>No hay respuestas registradas para este formulario.</p>
          </div>
        ) : (
          <>
            <div
              className="grid px-4 pb-3 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--color-on-surface-variant)]"
              style={{ gridTemplateColumns }}
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
                    className={rowSurface}
                    style={{ gridTemplateColumns }}
                  >
                    <div className={`text-sm ${TOK.textSubtle}`}>
                      {formatDate(submission.submittedAt)}
                    </div>
                    <div className="text-sm">
                      {submission.contact ? (
                        <Link href={`/crm/contactos/${submission.contact.id}`} className={TOK.linkAccent}>
                          {submission.contact.name}
                          <span className={`mt-0.5 block text-xs font-normal ${TOK.textSubtle}`}>
                            {submission.contact.email}
                          </span>
                        </Link>
                      ) : (
                        <span className={TOK.textSubtle}>Sin contacto</span>
                      )}
                    </div>
                    {form.fields.map((field) => (
                      <div key={field.id} className={`max-w-[260px] text-sm ${TOK.textMuted}`}>
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
        <div className={`flex flex-wrap items-center justify-between gap-3 text-sm ${TOK.textMuted}`}>
          <span>
            Mostrando {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex flex-wrap gap-2">
            {page > 1 && (
              <Link
                href={`/crm/formularios/${form.id}/respuestas?page=${page - 1}`}
                className={TOK.pagerLink}
              >
                Anterior
              </Link>
            )}
            {skip + PAGE_SIZE < total && (
              <Link
                href={`/crm/formularios/${form.id}/respuestas?page=${page + 1}`}
                className={TOK.pagerLink}
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
