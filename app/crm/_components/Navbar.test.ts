import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const navbar = readFileSync('app/crm/_components/Navbar.tsx', 'utf8')

test('CRM navbar reads the current user name from the database', () => {
  assert.match(navbar, /select:\s*{\s*name:\s*true,\s*image:\s*true\s*}/)
  assert.match(navbar, /const name = user\?\.name \?\? session\?\.user\?\.name \?\? ''/)
})
