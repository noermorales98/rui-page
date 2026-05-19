import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getValidAccessToken } from '@/lib/integrations/zoom'
import crypto from 'crypto'

const CDN = 'https://source.zoom.us/6.0.2'

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

function j(value: string): string {
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
      errorHtml('Faltan credenciales SDK (ZOOM_SDK_KEY / ZOOM_SDK_SECRET)'),
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

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${meeting.topic}</title>
  <link rel="stylesheet" href="${CDN}/css/bootstrap.css" />
  <link rel="stylesheet" href="${CDN}/css/react-select.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    /* Zoom injects into #zmmtg-root — make it fill the viewport */
    #zmmtg-root { display: block !important; width: 100% !important; }
    .meeting-app { width: 100vw !important; height: 100vh !important; }
  </style>
</head>
<body>
  <div id="zmmtg-root"></div>

  <script src="${CDN}/lib/vendor/react.min.js"></script>
  <script src="${CDN}/lib/vendor/react-dom.min.js"></script>
  <script src="${CDN}/lib/vendor/redux.min.js"></script>
  <script src="${CDN}/lib/vendor/redux-thunk.min.js"></script>
  <script src="${CDN}/lib/vendor/lodash.min.js"></script>
  <script src="${CDN}/zoom-meeting-6.0.2.min.js"></script>
  <script>
    ZoomMtg.setZoomJSLib(${j(`${CDN}/lib`)}, '/av');
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();

    ZoomMtg.init({
      leaveUrl: 'about:blank',
      isSupportAV: true,
      isSupportChat: true,
      isSupportQA: false,
      isSupportPolling: false,
      isSupportBreakout: true,
      enableHD: true,
      success: function () {
        ZoomMtg.join({
          meetingNumber: ${j(meeting.zoomId)},
          userName: ${j(userName)},
          signature: ${j(signature)},
          sdkKey: ${j(process.env.ZOOM_SDK_KEY)},
          passWord: ${j(meeting.password ?? '')},
          ${zak ? `zak: ${j(zak)},` : ''}
          success: function () {},
          error: function (e) { console.error('[ZoomRoom] join error', e); },
        });
      },
      error: function (e) { console.error('[ZoomRoom] init error', e); },
    });
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
