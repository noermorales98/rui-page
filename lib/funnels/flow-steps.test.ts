import assert from 'node:assert/strict'
import test from 'node:test'

import { visualStepsToService, serviceStepsToVisual } from './flow-steps'

test('visualStepsToService converts email step', () => {
  const result = visualStepsToService([
    { id: 'a', type: 'email', subject: 'Hola', body: 'Bienvenido' },
  ])
  assert.deepEqual(result, [
    { action: 'SEND_EMAIL', delayMins: 0, config: { subject: 'Hola', body: 'Bienvenido' } },
  ])
})

test('visualStepsToService converts wait step in hours', () => {
  const result = visualStepsToService([{ id: 'b', type: 'wait', amount: 3, unit: 'hours' }])
  assert.deepEqual(result, [{ action: 'WAIT', delayMins: 180, config: {} }])
})

test('visualStepsToService converts wait step in days', () => {
  const result = visualStepsToService([{ id: 'c', type: 'wait', amount: 2, unit: 'days' }])
  assert.deepEqual(result, [{ action: 'WAIT', delayMins: 2880, config: {} }])
})

test('visualStepsToService converts tag step', () => {
  const result = visualStepsToService([{ id: 'd', type: 'tag', tag: 'asistente' }])
  assert.deepEqual(result, [{ action: 'ASSIGN_TAG', delayMins: 0, config: { tagName: 'asistente' } }])
})

test('visualStepsToService converts webhook step', () => {
  const result = visualStepsToService([
    { id: 'e', type: 'webhook', url: 'https://example.com/hook', method: 'POST' as const },
  ])
  assert.deepEqual(result, [
    { action: 'SEND_WEBHOOK', delayMins: 0, config: { url: 'https://example.com/hook', method: 'POST' } },
  ])
})

test('serviceStepsToVisual skips unsupported actions', () => {
  const result = serviceStepsToVisual([
    { action: 'UPDATE_CONTACT_STATUS', delayMins: 0, config: { status: 'QUALIFIED' } },
    { action: 'SEND_EMAIL', delayMins: 0, config: { subject: 'Hi', body: 'Hello' } },
  ])
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'email')
})

test('serviceStepsToVisual converts wait back to hours when less than a day', () => {
  const result = serviceStepsToVisual([{ action: 'WAIT', delayMins: 120, config: {} }])
  assert.deepEqual(result[0], { id: result[0].id, type: 'wait', amount: 2, unit: 'hours' })
})

test('serviceStepsToVisual converts wait back to days when >= 1440 mins', () => {
  const result = serviceStepsToVisual([{ action: 'WAIT', delayMins: 2880, config: {} }])
  assert.deepEqual(result[0], { id: result[0].id, type: 'wait', amount: 2, unit: 'days' })
})

test('serviceStepsToVisual falls back to POST for invalid webhook method', () => {
  const result = serviceStepsToVisual([
    { action: 'SEND_WEBHOOK', delayMins: 0, config: { url: 'https://x.com', method: 'PUT' } },
  ])
  assert.equal(result[0].type, 'webhook')
  if (result[0].type === 'webhook') assert.equal(result[0].method, 'POST')
})

test('serviceStepsToVisual handles missing email config fields', () => {
  const result = serviceStepsToVisual([
    { action: 'SEND_EMAIL', delayMins: 0, config: {} },
  ])
  assert.equal(result[0].type, 'email')
  if (result[0].type === 'email') {
    assert.equal(result[0].subject, '')
    assert.equal(result[0].body, '')
  }
})

test('serviceStepsToVisual handles empty steps array', () => {
  const result = serviceStepsToVisual([])
  assert.deepEqual(result, [])
})
