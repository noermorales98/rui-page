import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLeadPayload, type KommoConfig, type KommoLeadInput } from './kommo'

const BASE_CONFIG: KommoConfig = {
  pipelineId: 1,
  statusId: 10,
  emailFieldId: 100,
  phoneFieldId: 200,
}

test('includes email and phone when field_ids and values exist', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: 'ana@test.com',
    phone: '+521234567890',
    formSlug: 'contacto',
    formName: 'Formulario de Contacto',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    _embedded: { contacts: Array<{ custom_fields_values: Array<{ field_id: number; values: Array<{ value: string }> }> }> }
  }>
  const fields = lead._embedded.contacts[0].custom_fields_values
  assert.equal(fields.length, 2)
  assert.equal(fields[0].field_id, 100)
  assert.equal(fields[0].values[0].value, 'ana@test.com')
  assert.equal(fields[1].field_id, 200)
  assert.equal(fields[1].values[0].value, '+521234567890')
})

test('omits email when emailFieldId is null', () => {
  const config: KommoConfig = { ...BASE_CONFIG, emailFieldId: null }
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: 'ana@test.com',
    phone: undefined,
    formSlug: 'f',
    formName: 'F',
  }
  const [lead] = buildLeadPayload(input, config) as Array<{
    _embedded: { contacts: Array<{ custom_fields_values: unknown[] }> }
  }>
  assert.equal(lead._embedded.contacts[0].custom_fields_values.length, 0)
})

test('omits phone when phone is undefined', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: 'ana@test.com',
    phone: undefined,
    formSlug: 'f',
    formName: 'F',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    _embedded: { contacts: Array<{ custom_fields_values: Array<{ field_id: number }> }> }
  }>
  const fields = lead._embedded.contacts[0].custom_fields_values
  assert.equal(fields.length, 1)
  assert.equal(fields[0].field_id, 100)
})

test('uses "Sin nombre" when contactName is undefined', () => {
  const input: KommoLeadInput = {
    contactName: undefined,
    email: 'x@x.com',
    phone: undefined,
    formSlug: 'f',
    formName: 'F',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    name: string
    _embedded: { contacts: Array<{ name: string }> }
  }>
  assert.equal(lead._embedded.contacts[0].name, 'Sin nombre')
  assert.ok(lead.name.includes('Sin nombre'))
})

test('puts formSlug as tag', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: undefined,
    phone: undefined,
    formSlug: 'mi-form',
    formName: 'Mi Formulario',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{
    _embedded: { tags: Array<{ name: string }> }
  }>
  assert.equal(lead._embedded.tags[0].name, 'mi-form')
})

test('lead name follows "Form: [formName] — [contactName]" pattern', () => {
  const input: KommoLeadInput = {
    contactName: 'Ana',
    email: undefined,
    phone: undefined,
    formSlug: 'f',
    formName: 'Mi Formulario',
  }
  const [lead] = buildLeadPayload(input, BASE_CONFIG) as Array<{ name: string }>
  assert.equal(lead.name, 'Form: Mi Formulario — Ana')
})
