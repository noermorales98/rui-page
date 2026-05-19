import { prisma } from '@/lib/prisma'

const ZOOM_API = 'https://api.zoom.us/v2'

function basicAuth(): string {
  const id = process.env.ZOOM_CLIENT_ID!
  const secret = process.env.ZOOM_CLIENT_SECRET!
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`
}

async function fetchS2SToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID
  if (!accountId || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
    throw new Error('Zoom no está configurado (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)')
  }

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: 'POST', headers: { Authorization: basicAuth() } },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Zoom S2S token failed ${res.status}: ${body}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  const expiresAt = Date.now() + data.expires_in * 1000

  await prisma.integration.upsert({
    where: { provider: 'ZOOM' },
    create: { provider: 'ZOOM', status: 'ACTIVE', config: { token: data.access_token, expiresAt } },
    update: { status: 'ACTIVE', config: { token: data.access_token, expiresAt }, lastSyncAt: new Date() },
  })

  return data.access_token
}

export async function getValidAccessToken(): Promise<string> {
  const integration = await prisma.integration.findUnique({ where: { provider: 'ZOOM' } })

  if (integration) {
    const cfg = integration.config as { token?: string; expiresAt?: number }
    if (cfg.token && cfg.expiresAt && Date.now() < cfg.expiresAt - 60_000) {
      return cfg.token
    }
  }

  return fetchS2SToken()
}

export function isZoomConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET,
  )
}

export async function verifyZoomConnection(): Promise<boolean> {
  try {
    const token = await getValidAccessToken()
    const res = await fetch(`${ZOOM_API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

type CreatedMeeting = {
  zoomId: string
  topic: string
  startUrl: string
  joinUrl: string
  password: string
}

export async function createZoomMeeting(topic: string, duration = 60): Promise<CreatedMeeting> {
  const token = await getValidAccessToken()

  const res = await fetch(`${ZOOM_API}/users/me/meetings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      type: 1, // instant
      duration,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        waiting_room: false,
        auto_recording: 'none',
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Zoom create meeting failed ${res.status}: ${body}`)
  }

  const data = (await res.json()) as {
    id: number
    topic: string
    start_url: string
    join_url: string
    password: string
  }

  return {
    zoomId: String(data.id),
    topic: data.topic,
    startUrl: data.start_url,
    joinUrl: data.join_url,
    password: data.password ?? '',
  }
}

// Kept for webhook compatibility
export function verifyZoomWebhook(token: string): boolean {
  const expected = process.env.ZOOM_VERIFICATION_TOKEN
  if (!expected) return false
  return token === expected
}
