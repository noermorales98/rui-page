import assert from 'node:assert/strict'
import test from 'node:test'
import { validateBlocks, isInvalidBlock } from './builder-validation'
import type { FunnelBlock } from './types'

function block(type: FunnelBlock['type'], config: Record<string, unknown>): FunnelBlock {
  return { id: `test-${type}`, type, config }
}

test('validateBlocks returns empty array when all blocks are valid', () => {
  const blocks: FunnelBlock[] = [
    block('HERO', { title: 'Hola' }),
    block('TEXT', { body: 'Contenido' }),
  ]
  assert.deepEqual(validateBlocks(blocks), [])
})

test('validateBlocks flags HERO without title', () => {
  const errors = validateBlocks([block('HERO', { title: '' })])
  assert.equal(errors.length, 1)
  assert.equal(errors[0].blockId, 'test-HERO')
})

test('validateBlocks flags VIDEO with invalid url', () => {
  const errors = validateBlocks([block('VIDEO', { url: 'https://tiktok.com/video' })])
  assert.equal(errors.length, 1)
})

test('validateBlocks accepts VIDEO with youtube url', () => {
  const errors = validateBlocks([block('VIDEO', { url: 'https://youtube.com/watch?v=abc' })])
  assert.deepEqual(errors, [])
})

test('validateBlocks accepts VIDEO with mp4 url', () => {
  const errors = validateBlocks([block('VIDEO', { url: 'https://cdn.example.com/video.mp4' })])
  assert.deepEqual(errors, [])
})

test('validateBlocks flags CTA missing buttonText', () => {
  const errors = validateBlocks([block('CTA', { buttonText: '', href: '/registro' })])
  assert.equal(errors.length, 1)
})

test('validateBlocks flags CTA missing href', () => {
  const errors = validateBlocks([block('CTA', { buttonText: 'Entrar', href: '' })])
  assert.equal(errors.length, 1)
})

test('validateBlocks flags CUSTOM_HTML with empty html', () => {
  const errors = validateBlocks([block('CUSTOM_HTML', { html: '', css: '' })])
  assert.equal(errors.length, 1)
})

test('isInvalidBlock returns true when blockId is in errors', () => {
  const errors = [{ blockId: 'abc', message: 'error' }]
  assert.equal(isInvalidBlock('abc', errors), true)
  assert.equal(isInvalidBlock('xyz', errors), false)
})
