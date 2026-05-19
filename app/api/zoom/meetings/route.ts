import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createZoomMeeting, isZoomConfigured } from '@/lib/integrations/zoom'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isZoomConfigured()) {
    return NextResponse.json({ error: 'Zoom no está configurado' }, { status: 503 })
  }

  const body = (await req.json()) as { topic?: string; contactId?: number; duration?: number }
  const topic = body.topic?.trim() || 'Reunión'
  const duration = body.duration ?? 60

  try {
    const meeting = await createZoomMeeting(topic, duration)

    const saved = await prisma.zoomMeeting.create({
      data: {
        zoomId: meeting.zoomId,
        topic: meeting.topic,
        startUrl: meeting.startUrl,
        joinUrl: meeting.joinUrl,
        password: meeting.password,
        contactId: body.contactId ?? null,
      },
    })

    return NextResponse.json({ ok: true, meeting: saved })
  } catch (err) {
    console.error('[zoom/meetings POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al crear reunión' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = Number(req.nextUrl.searchParams.get('id'))
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  await prisma.zoomMeeting.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contactId = req.nextUrl.searchParams.get('contactId')

  const meetings = await prisma.zoomMeeting.findMany({
    where: contactId ? { contactId: Number(contactId) } : {},
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ meetings })
}
