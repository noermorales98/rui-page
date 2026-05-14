import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(): Promise<Response> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clientId = process.env.ZOOM_CLIENT_ID
  const redirectUri = process.env.ZOOM_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Zoom not configured' }, { status: 500 })
  }

  const url = new URL('https://zoom.us/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(url.toString())
}
