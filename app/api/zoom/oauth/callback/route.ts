import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { saveZoomTokens } from '@/lib/integrations/zoom'

const ZOOM_OAUTH = 'https://zoom.us/oauth/token'

function basicAuth(): string {
  const id = process.env.ZOOM_CLIENT_ID!
  const secret = process.env.ZOOM_CLIENT_SECRET!
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`
}

export async function GET(req: NextRequest): Promise<Response> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?error=forbidden', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?error=no_code', req.url))
  }

  const redirectUri = process.env.ZOOM_REDIRECT_URI!

  try {
    const res = await fetch(
      `${ZOOM_OAUTH}?grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      { method: 'POST', headers: { Authorization: basicAuth() } },
    )

    if (!res.ok) {
      throw new Error(`Token exchange failed: ${res.status}`)
    }

    const data = (await res.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    await saveZoomTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    })

    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?success=zoom', req.url))
  } catch (err) {
    console.error('[zoom/callback]', err)
    return NextResponse.redirect(new URL('/crm/configuracion/integraciones?error=exchange_failed', req.url))
  }
}
