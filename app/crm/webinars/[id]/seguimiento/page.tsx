import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { calcMetrics } from './_lib/seguimiento'
import { SeguimientoMetrics } from './_components/SeguimientoMetrics'
import { SeguimientoTable } from './_components/SeguimientoTable'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SeguimientoPage({ params }: Props) {
  const { id } = await params
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    select: {
      id: true,
      title: true,
      registrations: {
        select: {
          id: true,
          status: true,
          commercialStatus: true,
          createdAt: true,
          contactId: true,
          registrationCount: true,
          registrationDates: true,
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              activities: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { id: true, createdAt: true, type: true },
              },
              deals: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  stage: true,
                  courseName: true,
                  sales: {
                    where: { status: 'PAID' },
                    select: { amountCents: true },
                  },
                },
                orderBy: { updatedAt: 'desc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!webinar) notFound()

  const metrics = calcMetrics(webinar.registrations)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/crm/webinars/${webinarId}`}
        className={`inline-flex items-center gap-1 ${TOK.textMuted} transition-colors hover:text-[var(--color-on-surface)]`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        {webinar.title}
      </Link>

      <div>
        <h2 className={TOK.sectionTitle}>Seguimiento comercial</h2>
        <p className={`mt-1 ${TOK.sectionSubtitle}`}>{metrics.total} contactos · Actualizado en tiempo real</p>
      </div>

      <SeguimientoMetrics metrics={metrics} />

      <div className={`${TOK.panel} p-6`}>
        <SeguimientoTable registrations={webinar.registrations} webinarId={webinarId} />
      </div>
    </div>
  )
}
