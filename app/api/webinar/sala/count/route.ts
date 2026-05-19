import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? '1')
const LIVE_WINDOW_SECONDS = 90

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - LIVE_WINDOW_SECONDS * 1000)
    const count = await prisma.webinarLiveSession.count({
      where: { webinarId: WEBINAR_PUBLIC_ID, lastSeen: { gte: cutoff } },
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
