import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from './crypto'
import type { Prisma } from '@prisma/client'

type ZoomTokens = {
  access_token: string
  refresh_token: string
  expires_at: number // Unix ms
}

type ZoomRegistrant = {
  id: string
  email: string
  first_name: string
  last_name: string
  status: string
}

const ZOOM_API = 'https://api.zoom.us/v2'
const ZOOM_OAUTH = 'https://zoom.us/oauth/token'

function basicAuth(): string {
  const id = process.env.ZOOM_CLIENT_ID!
  const secret = process.env.ZOOM_CLIENT_SECRET!
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`
}

export async function getZoomTokens(): Promise<ZoomTokens | null> {
  const integration = await prisma.integration.findUnique({
    where: { provider: 'ZOOM' },
  })
  if (!integration) return null

  const config = integration.config as Prisma.JsonObject
  if (!config.encrypted) return null

  const tokens = JSON.parse(decrypt(config.encrypted as string)) as ZoomTokens
  return tokens
}

export async function saveZoomTokens(tokens: ZoomTokens): Promise<void> {
  const encrypted = encrypt(JSON.stringify(tokens))
  await prisma.integration.upsert({
    where: { provider: 'ZOOM' },
    create: {
      provider: 'ZOOM',
      status: 'ACTIVE',
      config: { encrypted },
    },
    update: {
      status: 'ACTIVE',
      config: { encrypted },
      lastSyncAt: new Date(),
    },
  })
}

export async function refreshZoomToken(refreshToken: string): Promise<ZoomTokens> {
  const res = await fetch(`${ZOOM_OAUTH}?grant_type=refresh_token&refresh_token=${refreshToken}`, {
    method: 'POST',
    headers: { Authorization: basicAuth() },
  })
  if (!res.ok) throw new Error(`Zoom token refresh failed: ${res.status}`)
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await getZoomTokens()
  if (!tokens) throw new Error('Zoom no está conectado')

  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token
  }

  const refreshed = await refreshZoomToken(tokens.refresh_token)
  await saveZoomTokens(refreshed)
  return refreshed.access_token
}

export async function fetchZoomRegistrants(zoomWebinarId: string): Promise<ZoomRegistrant[]> {
  const token = await getValidAccessToken()
  const results: ZoomRegistrant[] = []
  let nextPageToken = ''

  do {
    const url = new URL(`${ZOOM_API}/webinars/${zoomWebinarId}/registrants`)
    url.searchParams.set('page_size', '300')
    if (nextPageToken) url.searchParams.set('next_page_token', nextPageToken)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      if (res.status === 404) return []
      throw new Error(`Zoom registrants fetch failed: ${res.status}`)
    }

    const data = (await res.json()) as {
      registrants: ZoomRegistrant[]
      next_page_token?: string
    }

    results.push(...data.registrants)
    nextPageToken = data.next_page_token ?? ''
  } while (nextPageToken)

  return results
}

export function verifyZoomWebhook(token: string): boolean {
  const expected = process.env.ZOOM_VERIFICATION_TOKEN
  if (!expected) return false
  return token === expected
}
