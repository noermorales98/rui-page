import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ZoomEmbed } from './_components/ZoomEmbed'
import { ArrowLeft, Video } from 'lucide-react'

interface Props {
  params: Promise<{ meetingId: string }>
}

export default async function ZoomSalaPage({ params }: Props) {
  await auth() // ensures the user is authenticated before serving the page
  const { meetingId } = await params

  const id = Number(meetingId)
  if (isNaN(id)) notFound()

  const meeting = await prisma.zoomMeeting.findUnique({
    where: { id },
    include: { contact: { select: { id: true, name: true } } },
  })

  if (!meeting) notFound()

  const returnHref = meeting.contact
    ? `/crm/contactos/${meeting.contact.id}`
    : '/crm/contactos'

  return (
    <div className="-mx-3 -mt-6 flex h-[calc(100dvh-4rem)] flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3">
        <Link
          href={returnHref}
          className="flex items-center gap-1.5 text-sm text-[var(--color-on-surface-variant)] transition hover:text-[var(--color-on-surface)]"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          {meeting.contact ? meeting.contact.name : 'Contactos'}
        </Link>
        <div className="mx-2 h-4 w-px bg-[var(--color-outline-variant)]" />
        <Video size={15} strokeWidth={2} className="text-[#2D8CFF]" />
        <span className="text-sm font-semibold text-[var(--color-on-surface)]">{meeting.topic}</span>
        {meeting.password && (
          <span className="ml-auto text-xs text-[var(--color-on-surface-variant)]">
            Clave: <span className="font-mono">{meeting.password}</span>
          </span>
        )}
      </div>

      {/* iframe fills remaining height — Zoom SDK runs isolated from React */}
      <div className="min-h-0 flex-1">
        <ZoomEmbed meetingId={id} />
      </div>
    </div>
  )
}
