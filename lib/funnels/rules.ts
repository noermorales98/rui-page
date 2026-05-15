export function normalizeCategoryNames(value: string | undefined | null): string[] {
  if (!value) return []
  const seen = new Set<string>()
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, ' '))
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 8)
}

const REQUIRED_WEBINAR_PAGES = [
  ['registration', 'Registro'],
  ['thank_you', 'Gracias'],
  ['access', 'Acceso'],
  ['room', 'Sala'],
] as const

export function canPublishFunnel(pages: Array<{ key: string }>): { ok: true } | { ok: false; error: string } {
  const keys = new Set(pages.map((page) => page.key))
  const missing = REQUIRED_WEBINAR_PAGES.find(([key]) => !keys.has(key))
  if (missing) return { ok: false, error: `Falta la pagina ${missing[1]} antes de publicar.` }
  return { ok: true }
}
