import { NextResponse } from 'next/server'
import { checkRateLimit, pruneRateLimit } from '@/lib/ratelimit/memory'
import { registerForFunnel } from '@/lib/services/funnels'

interface Props {
  params: Promise<{ slug: string }>
}

export async function POST(req: Request, { params }: Props) {
  const { slug } = await params
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  pruneRateLimit(60_000)
  const limited = checkRateLimit(`funnel:${slug}:${ip}`, 10, 60_000)
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: 'Demasiados intentos. Intenta de nuevo en un momento.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 })
  }

  const result = await registerForFunnel(slug, body)
  if (!result.ok) {
    const status = result.error.code === 'NOT_FOUND' ? 404 : result.error.code === 'VALIDATION_ERROR' ? 400 : 500
    return NextResponse.json({ ok: false, error: result.error.message }, { status })
  }

  return NextResponse.json({ ok: true, redirectUrl: result.data.redirectUrl })
}
