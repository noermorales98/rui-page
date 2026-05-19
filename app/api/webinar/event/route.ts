import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? '1')

const ALLOWED_TYPES = new Set([
  'WHATSAPP_CLICK',
  'VIDEO_PLAY',
  'PAIN_SELECTED',
  'ACCESO_ENTRY',
  'SALA_ENTRY',
])

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type: string
      sessionId?: string
      meta?: Record<string, unknown>
    }

    if (!ALLOWED_TYPES.has(body.type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    await prisma.webinarEvent.create({
      data: {
        webinarId: WEBINAR_PUBLIC_ID,
        type: body.type,
        sessionId: body.sessionId ?? null,
        meta: (body.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
