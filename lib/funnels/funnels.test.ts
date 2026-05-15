import assert from 'node:assert/strict'
import test from 'node:test'

import { defaultTheme, defaultWebinarPages } from './defaults'
import { sanitizeCss, sanitizeHtml } from './sanitize'
import { resolveFunnelPagePath, slugifyFunnel } from './slug'

test('slugifyFunnel creates stable public slugs', () => {
  assert.equal(slugifyFunnel('Método de los 4 Ángeles'), 'metodo-de-los-4-angeles')
})

test('defaultWebinarPages creates the four required internal pages', () => {
  assert.deepEqual(defaultWebinarPages('metodo').map((page) => page.key), [
    'registration',
    'thank_you',
    'access',
    'room',
  ])
  assert.equal(defaultTheme.accentColor, '#9a7b45')
})

test('resolveFunnelPagePath maps public funnel paths to page keys', () => {
  assert.equal(resolveFunnelPagePath(undefined), 'registration')
  assert.equal(resolveFunnelPagePath('gracias'), 'thank_you')
  assert.equal(resolveFunnelPagePath('acceso'), 'access')
  assert.equal(resolveFunnelPagePath('sala'), 'room')
  assert.equal(resolveFunnelPagePath('bono'), 'bono')
})

test('sanitizeHtml and sanitizeCss strip unsafe author content', () => {
  assert.equal(
    sanitizeHtml('<h1 onclick="x()">Hola</h1><script>alert(1)</script>'),
    '<h1>Hola</h1>',
  )
  assert.equal(
    sanitizeCss('body{color:red;behavior:url(x);width:expression(alert(1))}'),
    'body{color:red;width:)}',
  )
})
