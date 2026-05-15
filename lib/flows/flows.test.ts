import assert from 'node:assert/strict'
import test from 'node:test'

import { assertValidRedirectPosition, calculateRunSchedule, matchesConfig } from './triggers'

test('matchesConfig treats empty trigger config as a match', () => {
  assert.equal(matchesConfig(null, { funnelId: 3 }), true)
  assert.equal(matchesConfig({}, { funnelId: 3 }), true)
})

test('matchesConfig requires configured values to match payload values', () => {
  assert.equal(matchesConfig({ funnelId: 3 }, { funnelId: 3, webinarId: 9 }), true)
  assert.equal(matchesConfig({ funnelId: 4 }, { funnelId: 3, webinarId: 9 }), false)
})

test('assertValidRedirectPosition rejects redirects after the first step', () => {
  assert.throws(
    () => assertValidRedirectPosition([
      { action: 'WAIT', position: 0 },
      { action: 'REDIRECT', position: 1 },
    ]),
    /REDIRECT/,
  )
})

test('calculateRunSchedule accumulates step delays', () => {
  const start = new Date('2026-05-15T10:00:00.000Z')
  assert.deepEqual(
    calculateRunSchedule(
      [
        { delayMins: 0 },
        { delayMins: 10 },
        { delayMins: 5 },
      ],
      start,
    ).map((date) => date.toISOString()),
    [
      '2026-05-15T10:00:00.000Z',
      '2026-05-15T10:10:00.000Z',
      '2026-05-15T10:15:00.000Z',
    ],
  )
})
