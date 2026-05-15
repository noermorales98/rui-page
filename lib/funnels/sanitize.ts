const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script>/gi
const EVENT_ATTR_RE = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const JAVASCRIPT_URL_RE = /\s+(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi
const DISALLOWED_CSS_PROP_RE = /\b(?:behavior|-moz-binding)\s*:\s*[^;}]*(?:;|(?=}))/gi
const EXPRESSION_RE = /expression\s*\([^)]*\)/gi

export function sanitizeHtml(html: string): string {
  return html
    .replace(SCRIPT_RE, '')
    .replace(EVENT_ATTR_RE, '')
    .replace(JAVASCRIPT_URL_RE, '')
    .replace(/<iframe\b([^>]*)>/gi, (_match, attrs: string) => {
      const src = String(attrs).match(/\s+src\s*=\s*(["'])(.*?)\1/i)?.[2] ?? ''
      if (!isAllowedFrameSrc(src)) return ''
      return `<iframe${attrs}>`
    })
}

export function sanitizeCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(DISALLOWED_CSS_PROP_RE, '')
    .replace(EXPRESSION_RE, '')
}

export function isAllowedFrameSrc(src: string): boolean {
  if (!src) return false
  try {
    const url = new URL(src, 'https://example.com')
    return [
      'youtube.com',
      'www.youtube.com',
      'youtube-nocookie.com',
      'www.youtube-nocookie.com',
      'player.vimeo.com',
      'vimeo.com',
      'zoom.us',
      'www.zoom.us',
      'us02web.zoom.us',
      'streamyard.com',
      'www.streamyard.com',
    ].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}
