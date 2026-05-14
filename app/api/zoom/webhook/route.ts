import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ZoomEvent = {
  event: string
  payload?: {
    object?: {
      id?: string
      registrant?: {
        email?: string
        first_name?: string
        last_name?: string
      }
      participant?: {
        email?: string
      }
    }
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const verificationToken = req.headers.get('authorization')
  const expected = process.env.ZOOM_VERIFICATION_TOKEN

  if (!expected || verificationToken !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: ZoomEvent
  try {
    body = (await req.json()) as ZoomEvent
  } catch (_e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body.event
  const obj = body.payload?.object

  if (!obj) return NextResponse.json({ ok: true })

  if (event === 'webinar.registration_created' || event === 'meeting.registrant_created') {
    const email = obj.registrant?.email?.trim().toLowerCase()
    const firstName = obj.registrant?.first_name ?? ''
    const lastName = obj.registrant?.last_name ?? ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || (email ?? 'Sin nombre')
    const externalId = obj.id

    if (email && externalId) {
      const wi = await prisma.webinarIntegration.findFirst({
        where: { externalId },
      })

      if (wi) {
        const contact = await prisma.contact.upsert({
          where: { email },
          update: {},
          create: { name, email, source: 'WEBINAR' },
        })

        await prisma.webinarRegistration.upsert({
          where: { webinarId_contactId: { webinarId: wi.webinarId, contactId: contact.id } },
          update: {},
          create: { webinarId: wi.webinarId, contactId: contact.id, status: 'REGISTERED' },
        })
      }
    }
  }

  if (event === 'meeting.participant_joined' || event === 'webinar.participant_joined') {
    const email = obj.participant?.email?.trim().toLowerCase()
    const externalId = obj.id

    if (email && externalId) {
      const wi = await prisma.webinarIntegration.findFirst({
        where: { externalId },
      })

      if (wi) {
        const contact = await prisma.contact.findUnique({ where: { email } })
        if (contact) {
          await prisma.webinarRegistration.updateMany({
            where: { webinarId: wi.webinarId, contactId: contact.id },
            data: { status: 'ATTENDED' },
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
