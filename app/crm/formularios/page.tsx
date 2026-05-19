import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { ViewToggle, type ListView } from '@/app/crm/_components/ui'
import { CreateFormModal } from './_components/CreateFormModal'
import { FormulariosTable } from './_components/FormulariosTable'

const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? '1')

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function FormulariosPage({ searchParams }: Props) {
  const params = await searchParams
  const view: ListView = params.view === 'cards' ? 'cards' : 'table'
  const [forms, mainWebinar] = await Promise.all([
    prisma.crmForm.findMany({
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
    }),
    prisma.webinar.findUnique({
      where: { id: WEBINAR_PUBLIC_ID },
      select: { id: true, title: true, _count: { select: { registrations: true } } },
    }),
  ])

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

      {/* Webinar registration form (static) */}
      {mainWebinar && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--color-tertiary-container)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-on-tertiary-container)]">
                Webinar
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">Registro — {mainWebinar.title}</p>
                <p className="font-mono text-xs text-[var(--color-on-surface-variant)]">/webinar</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">{mainWebinar._count.registrations}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">registros</p>
              </div>
              <div className="flex gap-2">
                <a
                  href="/webinar"
                  target="_blank"
                  rel="noreferrer"
                  className={`${TOK.actionSecondary} text-xs`}
                >
                  Ver
                </a>
                <Link
                  href={`/crm/webinars/${WEBINAR_PUBLIC_ID}?tab=participantes`}
                  className={`${TOK.actionSecondary} text-xs`}
                >
                  Respuestas
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <FormulariosTable forms={forms} view={view} />
      </div>
    </div>
  )
}
