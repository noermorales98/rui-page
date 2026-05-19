import { z } from 'zod'
import { defaultTheme } from '@/lib/funnels/defaults'

const dateString = z.string().min(1, 'La fecha es requerida').refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'La fecha no es válida',
)

export const funnelThemeSchema = z.object({
  font: z.enum(['serif', 'sans']).default(defaultTheme.font),
  backgroundColor: z.string().min(4).default(defaultTheme.backgroundColor),
  surfaceColor: z.string().min(4).default(defaultTheme.surfaceColor),
  textColor: z.string().min(4).default(defaultTheme.textColor),
  mutedTextColor: z.string().min(4).default(defaultTheme.mutedTextColor),
  accentColor: z.string().min(4).default(defaultTheme.accentColor),
  buttonStyle: z.enum(['solid', 'outline']).default(defaultTheme.buttonStyle),
  radius: z.enum(['none', 'sm', 'md']).default(defaultTheme.radius),
})

export const funnelBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'HERO',
    'TEXT',
    'VIDEO',
    'FORM',
    'CTA',
    'FAQ',
    'TESTIMONIALS',
    'WEBINAR_ROOM',
    'CUSTOM_HTML',
    'FOOTER',
  ]),
  config: z.record(z.string(), z.unknown()),
})

export const createWebinarFunnelSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().trim().min(2, 'El slug debe tener al menos 2 caracteres'),
  webinarTitle: z.string().trim().min(2, 'El tema del webinar es requerido'),
  webinarDate: dateString,
  platform: z.string().trim().optional(),
  webinarUrl: z.string().trim().optional(),
  description: z.string().trim().optional(),
  categories: z.string().trim().optional(),
  theme: funnelThemeSchema.optional(),
})

export const createFunnelLinkedToWebinarSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().trim().min(2, 'El slug debe tener al menos 2 caracteres'),
  webinarId: z.coerce.number().int().positive('Selecciona un webinar'),
})

export const saveThemeSchema = funnelThemeSchema

export const saveBlocksSchema = z.object({
  blocks: z.array(funnelBlockSchema).min(1, 'La página necesita al menos un bloque'),
})

export const saveHtmlSchema = z.object({
  customHtml: z.string().trim().min(1, 'El HTML no puede estar vacío'),
  customCss: z.string().trim().optional(),
})

export const registerForFunnelSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre'),
  email: z.string().trim().email('Escribe un correo válido').transform((value) => value.toLowerCase()),
  phone: z.string().trim().optional(),
})
