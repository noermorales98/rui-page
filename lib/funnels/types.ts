export type FunnelTheme = {
  font: 'serif' | 'sans'
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedTextColor: string
  accentColor: string
  buttonStyle: 'solid' | 'outline'
  radius: 'none' | 'sm' | 'md'
}

export type FunnelBlockType =
  | 'HERO'
  | 'TEXT'
  | 'VIDEO'
  | 'FORM'
  | 'CTA'
  | 'FAQ'
  | 'TESTIMONIALS'
  | 'WEBINAR_ROOM'
  | 'CUSTOM_HTML'
  | 'FOOTER'

export type FunnelBlock = {
  id: string
  type: FunnelBlockType
  config: Record<string, unknown>
}

export type FunnelPageSeed = {
  key: 'registration' | 'thank_you' | 'access' | 'room'
  kind: 'REGISTRATION' | 'THANK_YOU' | 'ACCESS' | 'ROOM'
  slug: string | null
  title: string
  description: string
  position: number
  blocks: FunnelBlock[]
}
