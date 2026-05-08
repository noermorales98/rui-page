import assert from 'node:assert/strict'
import test from 'node:test'
import { renderCampaignEmail } from './email-template'

test('renders contact placeholders and escapes unsafe content', () => {
  const rendered = renderCampaignEmail({
    subject: 'Hola {{nombre}}',
    previewText: 'Invitacion para {{email}}',
    bodyText: 'Hola {{nombre}},\n\nTu correo es {{email}}.\n<script>alert(1)</script>',
    contact: {
      name: 'Ana & Luis',
      email: 'ana@example.com',
      phone: null,
      projectName: 'Metodo 4 Angeles',
    },
  })

  assert.equal(rendered.subject, 'Hola Ana & Luis')
  assert.equal(rendered.text, 'Hola Ana & Luis,\n\nTu correo es ana@example.com.\n<script>alert(1)</script>')
  assert.match(rendered.html, /Ana &amp; Luis/)
  assert.match(rendered.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.doesNotMatch(rendered.html, /<script>/)
})
