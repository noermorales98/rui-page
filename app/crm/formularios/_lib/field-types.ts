import type { CrmFormContactTarget, CrmFormFieldType } from '@prisma/client'
import { mergeHtmlFieldSettings, normalizeHtmlControl, validateHtmlControl } from '@/lib/forms/html-field'

export type FieldTemplate = {
  type: CrmFormFieldType
  label: string
  fieldKey: string
  placeholder: string
  contactTarget: CrmFormContactTarget
  isRequired: boolean
}

export const DEFAULT_FIELD_TEMPLATES: FieldTemplate[] = [
  {
    type: 'SHORT_TEXT',
    label: 'Nombre',
    fieldKey: 'nombre',
    placeholder: 'Tu nombre',
    contactTarget: 'NAME',
    isRequired: true,
  },
  {
    type: 'FULL_NAME',
    label: 'Nombre completo',
    fieldKey: 'nombre_completo',
    placeholder: 'Nombre y apellidos',
    contactTarget: 'NAME',
    isRequired: false,
  },
  {
    type: 'PHONE',
    label: 'Telefono',
    fieldKey: 'telefono',
    placeholder: '555 123 4567',
    contactTarget: 'PHONE',
    isRequired: false,
  },
  {
    type: 'PHONE_WITH_COUNTRY',
    label: 'Telefono con lada',
    fieldKey: 'telefono_con_lada',
    placeholder: '+52 555 123 4567',
    contactTarget: 'PHONE',
    isRequired: false,
  },
  {
    type: 'EMAIL',
    label: 'Correo',
    fieldKey: 'correo',
    placeholder: 'tu@correo.com',
    contactTarget: 'EMAIL',
    isRequired: true,
  },
  {
    type: 'CUSTOM_DATE',
    label: 'Fecha',
    fieldKey: 'fecha',
    placeholder: 'Selecciona una fecha',
    contactTarget: 'NONE',
    isRequired: false,
  },
  {
    type: 'CUSTOM_TIME',
    label: 'Hora',
    fieldKey: 'hora',
    placeholder: 'Selecciona una hora',
    contactTarget: 'NONE',
    isRequired: false,
  },
  {
    type: 'CUSTOM_DATETIME',
    label: 'Fecha y hora',
    fieldKey: 'fecha_y_hora',
    placeholder: 'Selecciona fecha y hora',
    contactTarget: 'NONE',
    isRequired: false,
  },
]

export const FIELD_TYPE_LABELS: Record<CrmFormFieldType, string> = {
  SHORT_TEXT: 'Texto corto',
  FULL_NAME: 'Nombre completo',
  PHONE: 'Telefono',
  PHONE_WITH_COUNTRY: 'Telefono con lada',
  EMAIL: 'Correo',
  CUSTOM_DATE: 'Fecha',
  CUSTOM_TIME: 'Hora',
  CUSTOM_DATETIME: 'Fecha y hora',
  HTML_INPUT: 'HTML personalizado',
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
}

export function normalizeValue(type: CrmFormFieldType, rawValue: string, config?: unknown) {
  const value = rawValue.trim()

  if (type === 'HTML_INPUT') {
    return normalizeHtmlControl(mergeHtmlFieldSettings(config), rawValue)
  }

  if (type === 'EMAIL') return value.toLowerCase()
  if (type === 'PHONE' || type === 'PHONE_WITH_COUNTRY') return value.replace(/[^\d+]/g, '')
  if (type === 'CUSTOM_DATE' || type === 'CUSTOM_TIME' || type === 'CUSTOM_DATETIME') return value

  return value.slice(0, 191)
}

export function validateFieldValue(
  type: CrmFormFieldType,
  rawValue: string,
  isRequired: boolean,
  config?: unknown,
) {
  if (type === 'HTML_INPUT') {
    return validateHtmlControl(mergeHtmlFieldSettings(config), rawValue, isRequired)
  }

  const value = rawValue.trim()

  if (isRequired && !value) return 'Este campo es obligatorio'
  if (!value) return null

  if (type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Correo invalido'
  }

  if ((type === 'PHONE' || type === 'PHONE_WITH_COUNTRY') && normalizeValue(type, value).length < 7) {
    return 'Telefono invalido'
  }

  if (type === 'CUSTOM_DATE' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Fecha invalida'
  }

  if (type === 'CUSTOM_TIME' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return 'Hora invalida'
  }

  if (type === 'CUSTOM_DATETIME' && !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return 'Fecha y hora invalida'
  }

  return null
}
