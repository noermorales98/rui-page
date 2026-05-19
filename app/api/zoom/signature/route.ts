import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import crypto from 'crypto'
import { getValidAccessToken } from '@/lib/integrations/zoom'

function generateSignature(meetingNumber: string, role: 0 | 1): string {
  const sdkKey = process.env.ZOOM_SDK_KEY!
  const sdkSecret = process.env.ZOOM_SDK_SECRET!

  const iat = Math.round(Date.now() / 1000) - 30
  const exp = iat + 60 * 60 * 2

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ appKey: sdkKey, mn: meetingNumber, role, iat, exp, tokenExp: exp }),
  ).toString('base64url')

  const sig = crypto
    .createHmac('sha256', sdkSecret)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${sig}`
}

async function getZakToken(): Promise<string | null> {
  try {
    const token = await getValidAccessToken()
    const res = await fetch('https://api.zoom.us/v2/users/me/token?type=zak', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { token: string }
    return data.token ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
    return NextResponse.json(
      { error: 'SDK credentials not configured. Create a General App in marketplace.zoom.us, enable Meeting SDK under Features → Embed, and add ZOOM_SDK_KEY and ZOOM_SDK_SECRET to .env' },
      { status: 503 },
    )
  }

  const body = (await req.json()) as { meetingNumber: string; role?: 0 | 1 }
  if (!body.meetingNumber) {
    return NextResponse.json({ error: 'meetingNumber required' }, { status: 400 })
  }

  const role = body.role ?? 1
  const [signature, zak] = await Promise.all([
    Promise.resolve(generateSignature(body.meetingNumber, role)),
    role === 1 ? getZakToken() : Promise.resolve(null),
  ])

  return NextResponse.json({ signature, sdkKey: process.env.ZOOM_SDK_KEY, zak })
}
