import { NextRequest, NextResponse } from 'next/server'

// OAuth callback is no longer used — Zoom integration uses Server-to-Server OAuth.
export async function GET(req: NextRequest): Promise<Response> {
  return NextResponse.redirect(new URL('/crm/configuracion/integraciones', req.url))
}
