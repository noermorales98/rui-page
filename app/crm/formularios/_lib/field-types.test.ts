import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeValue, slugify, validateFieldValue } from './field-types'

test('slugify creates stable ascii keys from Spanish labels', () => {
  assert.equal(slugify('Teléfono con lada'), 'telefono_con_lada')
  assert.equal(slugify('  Fecha y hora!!  '), 'fecha_y_hora')
})

test('normalizeValue lowercases email and strips phone punctuation', () => {
  assert.equal(normalizeValue('EMAIL', '  Persona@Ejemplo.COM '), 'persona@ejemplo.com')
  assert.equal(normalizeValue('PHONE_WITH_COUNTRY', ' +52 (55) 1234-5678 '), '+525512345678')
})

test('validateFieldValue rejects invalid required temporal values', () => {
  assert.equal(validateFieldValue('CUSTOM_DATE', '', true), 'Este campo es obligatorio')
  assert.equal(validateFieldValue('CUSTOM_DATE', '05/08/2026', true), 'Fecha invalida')
  assert.equal(validateFieldValue('CUSTOM_TIME', '24:00', true), 'Hora invalida')
  assert.equal(validateFieldValue('CUSTOM_DATETIME', '2026-05-08 12:30', true), 'Fecha y hora invalida')
})
