import type { CrmFormContactTarget, CrmFormFieldType } from '@prisma/client'
import type { HtmlFieldSettings } from '@/lib/forms/html-field'
import { DEFAULT_FIELD_TEMPLATES } from './field-types'

export type PalettePreset = {
  id: string
  group: 'crm' | 'html'
  title: string
  subtitle?: string
  /** Payload inicial del diálogo (el usuario puede editar antes de crear). */
  defaults: {
    type: CrmFormFieldType
    label: string
    fieldKey: string
    placeholder: string
    helpText: string
    isRequired: boolean
    contactTarget: CrmFormContactTarget
    config?: Record<string, unknown> | null
  }
}

function crmPresets(): PalettePreset[] {
  return DEFAULT_FIELD_TEMPLATES.map((tpl) => ({
    id: `crm-${tpl.type}`,
    group: 'crm' as const,
    title: tpl.label,
    subtitle: tpl.type === 'EMAIL' ? 'Mapeo a contacto' : undefined,
    defaults: {
      type: tpl.type,
      label: tpl.label,
      fieldKey: tpl.fieldKey,
      placeholder: tpl.placeholder,
      helpText: '',
      isRequired: tpl.isRequired,
      contactTarget: tpl.contactTarget,
      config: null,
    },
  }))
}

function html(
  id: string,
  title: string,
  subtitle: string,
  label: string,
  fieldKey: string,
  placeholder: string,
  html: HtmlFieldSettings,
  contactTarget: CrmFormContactTarget = 'NONE',
  isRequired = false,
): PalettePreset {
  return {
    id: `html-${id}`,
    group: 'html',
    title,
    subtitle,
    defaults: {
      type: 'HTML_INPUT',
      label,
      fieldKey,
      placeholder,
      helpText: '',
      isRequired,
      contactTarget,
      config: { html },
    },
  }
}

/** Entradas HTML reutilizables en la paleta "Inputs". */
export const HTML_PALETTE_PRESETS: PalettePreset[] = [
  html('text', 'Texto', 'input type=text', 'Texto libre', 'texto_libre', 'Escribe aquí…', {
    element: 'input',
    inputType: 'text',
  }),
  html('search', 'Busqueda', 'input type=search', 'Buscar', 'busqueda', 'Buscar…', {
    element: 'input',
    inputType: 'search',
  }),
  html('url', 'URL', 'input type=url', 'Sitio web', 'sitio_web', 'https://…', {
    element: 'input',
    inputType: 'url',
  }),
  html('password', 'Contrasena', 'input type=password', 'Contrasena', 'contrasena', '••••••••', {
    element: 'input',
    inputType: 'password',
  }),
  html('number', 'Numero', 'input type=number', 'Cantidad', 'cantidad', '0', {
    element: 'input',
    inputType: 'number',
    min: 0,
  }),
  html('range', 'Deslizador', 'input type=range', 'Nivel', 'nivel', '', {
    element: 'input',
    inputType: 'range',
    min: 0,
    max: 100,
    step: 1,
  }),
  html('color', 'Color', 'input type=color', 'Color preferido', 'color', '', {
    element: 'input',
    inputType: 'color',
  }),
  html('date', 'Fecha (nativo)', 'input type=date', 'Fecha', 'fecha_nativa', '', {
    element: 'input',
    inputType: 'date',
  }),
  html('time', 'Hora (nativo)', 'input type=time', 'Hora', 'hora_nativa', '', {
    element: 'input',
    inputType: 'time',
  }),
  html('datetime-local', 'Fecha y hora (nativo)', 'datetime-local', 'Cita', 'cita', '', {
    element: 'input',
    inputType: 'datetime-local',
  }),
  html('month', 'Mes', 'input type=month', 'Mes', 'mes', '', { element: 'input', inputType: 'month' }),
  html('week', 'Semana', 'input type=week', 'Semana', 'semana', '', { element: 'input', inputType: 'week' }),
  html('tel-html', 'Telefono (HTML)', 'input type=tel', 'Telefono', 'telefono_html', '+52…', {
    element: 'input',
    inputType: 'tel',
  }, 'PHONE'),
  html('email-html', 'Correo (HTML)', 'input type=email', 'Correo', 'correo_html', 'correo@…', {
    element: 'input',
    inputType: 'email',
  }, 'EMAIL'),
  html('checkbox', 'Casilla', 'input type=checkbox', 'Acepto las condiciones', 'acepto', '', {
    element: 'input',
    inputType: 'checkbox',
  }),
  html('radio', 'Opciones (radio)', 'grupo radio', 'Opcion preferida', 'opcion', '', {
    element: 'input',
    inputType: 'radio',
    options: ['Opcion A', 'Opcion B', 'Opcion C'],
  }),
  html('file', 'Archivo', 'input type=file (solo nombre)', 'Adjunto', 'adjunto', '', {
    element: 'input',
    inputType: 'file',
    accept: '.pdf,.jpg,.jpeg,.png',
  }),
  html('hidden', 'Oculto', 'input type=hidden (valor fijo)', 'token', 'token_oculto', '', {
    element: 'input',
    inputType: 'hidden',
    defaultValue: '',
  }),
  html('textarea', 'Parrafo', 'textarea', 'Comentarios', 'comentarios', 'Escribe un parrafo…', {
    element: 'textarea',
    rows: 4,
    maxLength: 2000,
  }),
  html('select', 'Lista desplegable', 'select', 'Elige una opcion', 'lista', '', {
    element: 'select',
    options: ['Primera', 'Segunda', 'Tercera'],
  }),
]

export const CRM_PALETTE_PRESETS: PalettePreset[] = crmPresets()

export const ALL_PALETTE_PRESETS: PalettePreset[] = [...CRM_PALETTE_PRESETS, ...HTML_PALETTE_PRESETS]
