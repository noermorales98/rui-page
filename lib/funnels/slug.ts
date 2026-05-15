const RESERVED_PAGE_KEYS: Record<string, string> = {
  gracias: 'thank_you',
  acceso: 'access',
  sala: 'room',
}

export function slugifyFunnel(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return slug || 'funnel'
}

export function resolveFunnelPagePath(page?: string): string {
  if (!page) return 'registration'
  return RESERVED_PAGE_KEYS[page] ?? slugifyFunnel(page)
}

export function publicFunnelUrl(slug: string, pageKey?: string | null, pageSlug?: string | null): string {
  if (!pageKey || pageKey === 'registration') return `/f/${slug}`
  if (pageKey === 'thank_you') return `/f/${slug}/gracias`
  if (pageKey === 'access') return `/f/${slug}/acceso`
  if (pageKey === 'room') return `/f/${slug}/sala`
  return `/f/${slug}/${pageSlug ?? pageKey}`
}
