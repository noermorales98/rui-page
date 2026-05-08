import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { WebinarHeader } from './_components/WebinarHeader'
import { WebinarStats } from './_components/WebinarStats'
import { ParticipantsTable } from './_components/ParticipantsTable'
import { AddParticipantButton } from './_components/AddParticipantButton'
import { ImportCsvButton } from './_components/ImportCsvButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WebinarDetailPage({ params }: Props) {
  const { id } = await params
  const webinarId = Number(id)
  if (isNaN(webinarId)) notFound()

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      registrations: {
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!webinar) notFound()

  const registeredContactIds = webinar.registrations.map((r) => r.contactId)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/crm/webinars"
        className="inline-flex items-center gap-1 text-sm text-[#8a8a8a] hover:text-[#080808]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Webinars
      </Link>

      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)]">
        <WebinarHeader webinar={webinar} />
        <div className="p-6">
          <WebinarStats registrations={webinar.registrations} />
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Participantes ({webinar.registrations.length})
              </h3>
              <div className="flex gap-2">
                <ImportCsvButton webinarId={webinarId} />
                <AddParticipantButton
                  webinarId={webinarId}
                  registeredContactIds={registeredContactIds}
                />
              </div>
            </div>
            <ParticipantsTable registrations={webinar.registrations} />
          </div>
        </div>
      </div>
    </div>
  )
}
