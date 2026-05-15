import assert from 'node:assert/strict'
import test from 'node:test'

import { categoryLabel, normalizeStudioTab, publicPageUrl } from './view-model'

test('normalizeStudioTab falls back to paginas', () => {
  assert.equal(normalizeStudioTab('tema'), 'tema')
  assert.equal(normalizeStudioTab('bad'), 'paginas')
  assert.equal(normalizeStudioTab(undefined), 'paginas')
})

test('publicPageUrl builds known funnel page urls', () => {
  assert.equal(publicPageUrl('metodo', 'registration', null), '/f/metodo')
  assert.equal(publicPageUrl('metodo', 'thank_you', 'gracias'), '/f/metodo/gracias')
  assert.equal(publicPageUrl('metodo', 'custom_bonus', 'bono'), '/f/metodo/bono')
})

test('categoryLabel joins category names for tables', () => {
  assert.equal(categoryLabel([{ category: { name: 'Webinar' } }, { category: { name: 'Curso' } }]), 'Webinar, Curso')
  assert.equal(categoryLabel([]), 'Sin categoria')
})
