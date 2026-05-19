import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? '1')

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as { sessionId: string }
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 36) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 })
    }

    await prisma.webinarLiveSession.upsert({
      where: { id: sessionId },
      update: { lastSeen: new Date() },
      create: {
        id: sessionId,
        webinarId: WEBINAR_PUBLIC_ID,
        lastSeen: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
