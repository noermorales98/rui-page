import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getValidAccessToken } from '@/lib/integrations/zoom'
import crypto from 'crypto'

function generateSignature(meetingNumber: string, role: 0 | 1): string {
  const sdkKey = process.env.ZOOM_SDK_KEY!
  const sdkSecret = process.env.ZOOM_SDK_SECRET!
  const iat = Math.round(Date.now() / 1000) - 30
  const exp = iat + 60 * 60 * 2
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ appKey: sdkKey, mn: meetingNumber, role, iat, exp, tokenExp: exp }),
  ).toString('base64url')
  const sig = crypto.createHmac('sha256', sdkSecret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}

async function getZak(): Promise<string | null> {
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

function safeJson(value: string): string {
  return JSON.stringify(value)
}

function errorHtml(message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#1a1a1a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#f87171;font-size:14px;padding:24px;text-align:center;}
  </style></head><body>${message}</body></html>`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
): Promise<Response> {
  const session = await auth()
  if (!session?.user) {
    return new Response(errorHtml('No autorizado'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
    return new Response(
      errorHtml('Faltan credenciales SDK. Agrega ZOOM_SDK_KEY y ZOOM_SDK_SECRET al .env'),
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  const { meetingId } = await params
  const id = Number(meetingId)
  if (isNaN(id)) {
    return new Response(errorHtml('Reunión no encontrada'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const meeting = await prisma.zoomMeeting.findUnique({ where: { id } })
  if (!meeting) {
    return new Response(errorHtml('Reunión no encontrada'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const [signature, zak] = await Promise.all([
    Promise.resolve(generateSignature(meeting.zoomId, 1)),
    getZak(),
  ])

  const userName = session.user.name ?? 'Host'
  const zakLine = zak ? `zak: ${safeJson(zak)},` : ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${meeting.topic}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #1a1a1a; overflow: hidden; }
    #meeting-root { width: 100%; height: 100%; }
    #status {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      color: #9ca3af; font-family: system-ui, sans-serif; font-size: 14px;
      background: #1a1a1a; z-index: 1;
    }
  </style>
</head>
<body>
  <div id="status">Conectando con Zoom...</div>
  <div id="meeting-root"></div>

  <script src="/api/zoom/sdk"></script>
  <script>
    (async function () {
      var statusEl = document.getElementById('status');
      try {
        var client = ZoomMtgEmbedded.createClient();

        await client.init({
          zoomAppRoot: document.getElementById('meeting-root'),
          language: 'es-ES',
        });

        await client.join({
          meetingNumber: ${safeJson(meeting.zoomId)},
          userName: ${safeJson(userName)},
          signature: ${safeJson(signature)},
          sdkKey: ${safeJson(process.env.ZOOM_SDK_KEY)},
          password: ${safeJson(meeting.password ?? '')},
          ${zakLine}
        });

        statusEl.style.display = 'none';
      } catch (err) {
        statusEl.textContent = 'Error al conectar: ' + (err && err.message ? err.message : String(err));
        console.error('[ZoomRoom]', err);
      }
    })();
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // No-cache: signature and ZAK expire
      'Cache-Control': 'no-store',
    },
  })
}
