import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { getValidAccessToken } from '@/lib/integrations/zoom'

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

async function getMeetingPassword(meetingId: string): Promise<string> {
  try {
    const token = await getValidAccessToken()
    const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return ''
    const data = (await res.json()) as { password?: string }
    return data.password ?? ''
  } catch {
    return ''
  }
}

function j(v: string) { return JSON.stringify(v) }

function errorHtml(msg: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#0b1120;display:flex;align-items:center;justify-content:center;
    height:100vh;font-family:system-ui;color:#8a94a8;font-size:13px;padding:24px;text-align:center}
  </style></head><body>${msg}</body></html>`
}

export async function GET(req: NextRequest): Promise<Response> {
  const meetingId = process.env.ZOOM_WEBINAR_MEETING_ID
  if (!meetingId || !process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
    return new Response(errorHtml('Webinar no configurado'), {
      status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const participantName = req.nextUrl.searchParams.get('name') || 'Espectador'
  const [signature, password] = await Promise.all([
    Promise.resolve(generateSignature(meetingId, 0)),
    getMeetingPassword(meetingId),
  ])

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="${CDN}/css/bootstrap.css"/>
  <link rel="stylesheet" href="${CDN}/css/react-select.css"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{width:100%;height:100%;overflow:hidden;background:#0b1120}
    #zmmtg-root{display:block!important}
    .meeting-app{width:100vw!important;height:100vh!important}
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

    /* Relay incoming Zoom chat messages → parent sidebar */
    ZoomMtg.inMeetingServiceListener('onReceiveChatMsg', function(data) {
      window.parent.postMessage({
        type: 'zoom-chat-message',
        author: data.senderName || 'Participante',
        text: data.chatContent || data.message || '',
        timestamp: Date.now(),
      }, '*');
    });

    /* Receive send requests from parent sidebar → Zoom chat */
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'zoom-send-chat') return;
      try {
        ZoomMtg.sendChat({ message: e.data.text, receiver: 0 });
      } catch(err) { console.error('[webinar] sendChat', err); }
    });

    /* ── Hide specific toolbar buttons for participants ── */
    var HIDDEN_LABELS = [
      'AI Companion', 'Record', 'Recording',
      'Show Captions', 'Captions', 'Live Transcript',
      'Share', 'Share Screen', 'Share screen',
    ];

    function hideRestrictedButtons() {
      /* Match by aria-label */
      document.querySelectorAll('[aria-label]').forEach(function(el) {
        var label = el.getAttribute('aria-label') || '';
        if (HIDDEN_LABELS.some(function(k) { return label.includes(k); })) {
          el.style.setProperty('display', 'none', 'important');
        }
      });
      /* Match by visible button text (Zoom renders text inside toolbar buttons) */
      document.querySelectorAll('.footer-button__button, [class*="toolbar"] button, [class*="footer"] button').forEach(function(btn) {
        var text = btn.textContent || '';
        if (HIDDEN_LABELS.some(function(k) { return text.includes(k); })) {
          btn.style.setProperty('display', 'none', 'important');
        }
      });
    }

    var _obs = new MutationObserver(hideRestrictedButtons);
    _obs.observe(document.body, { childList: true, subtree: true });

    ZoomMtg.init({
      leaveUrl: 'about:blank',
      isSupportAV: true,
      isSupportChat: true,
      isSupportCC: false,
      isSupportQA: false,
      isSupportPolling: false,
      isSupportBreakout: false,
      success: function() {
        ZoomMtg.join({
          meetingNumber: ${j(meetingId)},
          userName: ${j(participantName)},
          signature: ${j(signature)},
          sdkKey: ${j(process.env.ZOOM_SDK_KEY)},
          passWord: ${j(password)},
          success: function() {},
          error: function(e) { console.error('[webinar] join error', e); },
        });
      },
      error: function(e) { console.error('[webinar] init error', e); },
    });
  </script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
