import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getValidAccessToken } from '@/lib/integrations/zoom'

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

  let registrants: Array<{ id: string; email: string; first_name: string; last_name: string; status: string }>
  try {
    const token = await getValidAccessToken()
    const results: typeof registrants = []
    let nextPageToken = ''
    do {
      const url = new URL(`https://api.zoom.us/v2/webinars/${webinarIntegration.externalId}/registrants`)
      url.searchParams.set('page_size', '300')
      if (nextPageToken) url.searchParams.set('next_page_token', nextPageToken)
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { if (res.status === 404) break; throw new Error(`Zoom ${res.status}`) }
      const data = (await res.json()) as { registrants: typeof registrants; next_page_token?: string }
      results.push(...data.registrants)
      nextPageToken = data.next_page_token ?? ''
    } while (nextPageToken)
    registrants = results
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
    } catch {
      skipped++
    }
  }

  await prisma.webinarIntegration.update({
    where: { webinarId: crmWebinarId },
    data: { lastSyncAt: new Date() },
  })

  return NextResponse.json({ imported, skipped })
}
