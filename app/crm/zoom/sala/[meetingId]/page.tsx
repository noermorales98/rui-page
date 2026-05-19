import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ZoomRoom } from './_components/ZoomRoom'

interface Props {
  params: Promise<{ meetingId: string }>
}

export default async function ZoomSalaPage({ params }: Props) {
  await auth()
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
    <ZoomRoom
      meetingId={id}
      topic={meeting.topic}
      password={meeting.password}
      joinUrl={meeting.joinUrl}
      contactName={meeting.contact?.name}
      returnHref={returnHref}
    />
  )
}
