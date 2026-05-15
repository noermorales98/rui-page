import { publicFunnelUrl } from '@/lib/funnels/slug'

export type StudioTab = 'paginas' | 'contenido' | 'tema' | 'html' | 'flujo' | 'publicacion'

const TABS: StudioTab[] = ['paginas', 'contenido', 'tema', 'html', 'flujo', 'publicacion']

export function normalizeStudioTab(value?: string): StudioTab {
  return TABS.includes(value as StudioTab) ? (value as StudioTab) : 'paginas'
}

export function publicPageUrl(funnelSlug: string, pageKey: string, pageSlug: string | null): string {
  return publicFunnelUrl(funnelSlug, pageKey, pageSlug)
}

export function categoryLabel(items: Array<{ category: { name: string } }>): string {
  if (items.length === 0) return 'Sin categoria'
  return items.map((item) => item.category.name).join(', ')
}
