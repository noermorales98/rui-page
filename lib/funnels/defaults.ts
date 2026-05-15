import type { FunnelBlock, FunnelPageSeed, FunnelTheme } from './types'

export const defaultTheme: FunnelTheme = {
  font: 'serif',
  backgroundColor: '#f4ede4',
  surfaceColor: '#faf6f1',
  textColor: '#2a231c',
  mutedTextColor: '#5c4f42',
  accentColor: '#9a7b45',
  buttonStyle: 'solid',
  radius: 'sm',
}

function block(id: string, type: FunnelBlock['type'], config: FunnelBlock['config']): FunnelBlock {
  return { id, type, config }
}

export function defaultWebinarPages(funnelSlug: string): FunnelPageSeed[] {
  return [
    {
      key: 'registration',
      kind: 'REGISTRATION',
      slug: null,
      title: 'Registro al webinar',
      description: 'Pagina principal para capturar registros.',
      position: 0,
      blocks: [
        block('hero', 'HERO', {
          eyebrow: 'Webinar en vivo',
          title: 'Si has logrado mucho, pero sientes que algo falta, esto no es casualidad',
          subtitle: 'Descubre como reconectar con tu proposito en una experiencia gratuita.',
          ctaText: 'Reserva tu lugar gratis',
          ctaHref: '#registro',
        }),
        block('form', 'FORM', { title: 'Reserva tu lugar', submitLabel: 'Reservar mi lugar' }),
        block('text', 'TEXT', {
          title: 'En este webinar descubriras',
          body: 'Tres ideas practicas para tomar decisiones con mas claridad y menos ruido.',
        }),
        block('footer', 'FOOTER', { text: 'Rui Machalele' }),
      ],
    },
    {
      key: 'thank_you',
      kind: 'THANK_YOU',
      slug: 'gracias',
      title: 'Gracias por registrarte',
      description: 'Confirmacion despues del registro.',
      position: 1,
      blocks: [
        block('hero', 'HERO', {
          eyebrow: 'Registro confirmado',
          title: 'Tu lugar esta reservado',
          subtitle: 'Te enviaremos el acceso el dia del evento.',
          ctaText: 'Volver al inicio',
          ctaHref: `/f/${funnelSlug}`,
        }),
      ],
    },
    {
      key: 'access',
      kind: 'ACCESS',
      slug: 'acceso',
      title: 'Acceso al webinar',
      description: 'Antesala y mensaje de bienvenida.',
      position: 2,
      blocks: [
        block('hero', 'HERO', {
          eyebrow: 'Antesala del webinar',
          title: 'Estas a punto de entrar a una experiencia diferente',
          subtitle: 'Toma unos segundos para llegar con presencia.',
          ctaText: 'Entrar al webinar',
          ctaHref: `/f/${funnelSlug}/sala`,
        }),
      ],
    },
    {
      key: 'room',
      kind: 'ROOM',
      slug: 'sala',
      title: 'Sala del webinar',
      description: 'Webinar en vivo.',
      position: 3,
      blocks: [
        block('room', 'WEBINAR_ROOM', {
          title: 'Webinar en vivo',
          body: 'Quédate hasta el final. Habra algo importante para quienes quieren tomar decisiones con claridad.',
        }),
      ],
    },
  ]
}

export const defaultConfigByType: Record<FunnelBlock['type'], Record<string, unknown>> = {
  HERO:         { eyebrow: '', title: 'Tu título', subtitle: '', ctaText: 'Quiero entrar', ctaHref: '#registro' },
  TEXT:         { title: '', body: 'Escribe aquí el contenido...', align: 'left' },
  VIDEO:        { url: '', caption: '', aspect: '16/9' },
  FORM:         { title: '', formId: null, formSlug: null },
  CTA:          { title: '', body: '', buttonText: 'Quiero entrar', href: '#registro', variant: 'primary' },
  FAQ:          { heading: 'Preguntas frecuentes', items: [] },
  TESTIMONIALS: { heading: 'Lo que dicen', items: [] },
  WEBINAR_ROOM: { title: 'Webinar en vivo', body: '' },
  CUSTOM_HTML:  { html: '', css: '' },
  FOOTER:       { text: '', links: [] },
}
