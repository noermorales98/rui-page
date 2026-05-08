import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const indexPage = readFileSync('app/crm/campanas/page.tsx', 'utf8')
const newPagePath = 'app/crm/campanas/new/page.tsx'

test('/crm/campanas is the campaign table entry point', () => {
  assert.match(indexPage, /href=["']\/crm\/campanas\/new["']/)
  assert.match(indexPage, /Crear campaña/)
  assert.doesNotMatch(indexPage, /<CampaignWorkspace\b/)
})

test('/crm/campanas/new owns the campaign creation form', () => {
  const newPage = readFileSync(newPagePath, 'utf8')

  assert.match(newPage, /CampaignWorkspace/)
  assert.match(newPage, /Nueva campaña/)
})
