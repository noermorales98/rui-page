import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { hashIpForSubmit, submitForm } from '@/lib/services/forms'
import { checkRateLimit } from '@/lib/ratelimit/memory'
import { createKommoLead } from '@/lib/services/kommo'

// 10 submissions per minute per IP+slug, per skills/rate-limit.md MVP.
const SUBMIT_WINDOW_MS = 60_000
const SUBMIT_LIMIT = 10

interface Ctx {
  params: Promise<{ slug: string }>
}

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null
}

function getClientIp(h: Headers): string {
  return (
    firstHeaderValue(h.get('x-forwarded-for')) ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: Request, ctx: Ctx): Promise<NextResponse> {
  const { slug } = await ctx.params
  const headerStore = await headers()
  const ip = getClientIp(headerStore)
  const origin = req.headers.get('origin')

  const rl = checkRateLimit(`forms:${slug}:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS)
  const rlHeaders: Record<string, string> = {
    'X-RateLimit-Limit': String(rl.limit),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + rl.resetMs / 1000)),
    // Allow embeds to read the response (intake is rate-limited so an
    // open Allow-Origin doesn't expand the attack surface beyond what
    // a direct curl already has).
    'Access-Control-Allow-Origin': origin ?? '*',
    Vary: 'Origin',
  }
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Intenta de nuevo en un momento.' } },
      { status: 429, headers: rlHeaders },
    )
  }

  // Accept both JSON and form-encoded bodies so the endpoint works for
  // browser fetch() AND traditional <form action="..."> embeds.
  const values: Record<string, string> = {}
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase()
  try {
    if (contentType.includes('application/json')) {
      const parsed: unknown = await req.json()
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === 'string') values[k] = v
          else if (typeof v === 'number' || typeof v === 'boolean') values[k] = String(v)
        }
      }
    } else {
      const formData = await req.formData()
      const keys = new Set<string>()
      for (const k of formData.keys()) keys.add(k)
      for (const k of keys) {
        const parts = formData.getAll(k)
        const merged: string[] = []
        for (const v of parts) {
          if (typeof v === 'string') merged.push(v)
          else if (v instanceof File) merged.push(v.name || '')
        }
        values[k] = merged.join(', ')
      }
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Payload inválido' } },
      { status: 400, headers: rlHeaders },
    )
  }

  const ipHash = await hashIpForSubmit(firstHeaderValue(headerStore.get('x-forwarded-for')) ?? headerStore.get('x-real-ip'))
  const userAgent = headerStore.get('user-agent')

  const result = await submitForm(slug, values, { ipHash, userAgent })

  if (result.ok) {
    void createKommoLead({
      contactName: result.data.contactData.name,
      email: result.data.contactData.email,
      phone: result.data.contactData.phone,
      formSlug: result.data.formSlug,
      formName: result.data.formName,
    }).catch((err: unknown) => console.error('[Kommo] createKommoLead failed:', err))
  }

  if (!result.ok) {
    const status =
      result.error.code === 'NOT_FOUND' ? 404 :
      result.error.code === 'VALIDATION_ERROR' ? 422 :
      result.error.code === 'CONFLICT' ? 409 :
      500
    return NextResponse.json({ ok: false, error: result.error }, { status, headers: rlHeaders })
  }

  return NextResponse.json(
    {
      ok: true,
      message: result.data.successMessage,
      submissionId: result.data.submissionId,
    },
    { status: 200, headers: rlHeaders },
  )
}

/**
 * CORS preflight. Public form submissions can originate from any embed
 * site, so we mirror the requesting Origin. The actual POST is rate
 * limited and validated server-side, so an open Origin is acceptable.
 */
export async function OPTIONS(req: Request): Promise<NextResponse> {
  const origin = req.headers.get('origin') ?? '*'
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  })
}
