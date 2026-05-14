import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { fetchZoomRegistrants } from '@/lib/integrations/zoom'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ webinarId: string }> },
): Promise<Response> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { webinarId } = await params
  const crmWebinarId = Number(webinarId)
  if (isNaN(crmWebinarId)) {
    return NextResponse.json({ error: 'Invalid webinarId' }, { status: 400 })
  }

  const webinarIntegration = await prisma.webinarIntegration.findUnique({
    where: { webinarId: crmWebinarId },
  })

  if (!webinarIntegration?.externalId) {
    return NextResponse.json({ error: 'Webinar no vinculado a Zoom' }, { status: 404 })
  }

  let registrants
  try {
    registrants = await fetchZoomRegistrants(webinarIntegration.externalId)
  } catch (err) {
    console.error('[zoom/sync]', err)
    return NextResponse.json({ error: 'Error al obtener registrantes de Zoom' }, { status: 502 })
  }

  let imported = 0
  let skipped = 0

  for (const r of registrants) {
    if (!r.email?.trim()) { skipped++; continue }

    try {
      const email = r.email.trim().toLowerCase()
      const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || email

      const contact = await prisma.contact.upsert({
        where: { email },
        update: {},
        create: { name, email, source: 'WEBINAR' },
      })

      await prisma.webinarRegistration.upsert({
        where: { webinarId_contactId: { webinarId: crmWebinarId, contactId: contact.id } },
        update: {},
        create: { webinarId: crmWebinarId, contactId: contact.id, status: 'REGISTERED' },
      })

      imported++
    } catch (_e) {
      skipped++
    }
  }

  await prisma.webinarIntegration.update({
    where: { webinarId: crmWebinarId },
    data: { lastSyncAt: new Date() },
  })

  return NextResponse.json({ imported, skipped })
}
