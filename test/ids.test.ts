import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { idFromFilename, nextId, normalizeId, slugify } from '../src/core/ids'

test('normalizeId zero-pads numeric ids and keeps others', () => {
  assert.equal(normalizeId(42), '0042')
  assert.equal(normalizeId(' 7 '), '0007')
  assert.equal(normalizeId('12345'), '12345')
  assert.equal(normalizeId('ARCH-1'), 'ARCH-1')
  assert.equal(normalizeId(undefined), '')
})

test('idFromFilename reads the leading number', () => {
  assert.equal(idFromFilename('0042-adopt-event-sourcing.md'), '0042')
  assert.equal(idFromFilename('7_use-postgres.md'), '0007')
  assert.equal(idFromFilename('readme.md'), '')
})

test('slugify makes a kebab-case ascii filename part', () => {
  assert.equal(slugify('Adopt Event Sourcing for Orders'), 'adopt-event-sourcing-for-orders')
  assert.equal(slugify('Café — naïve résumé!'), 'cafe-naive-resume')
  assert.equal(slugify('x'.repeat(80)).length, 60)
})

test('nextId follows the highest numeric id', () => {
  assert.equal(nextId([]), '0001')
  assert.equal(nextId(['0001', '0042', 'ARCH-1']), '0043')
})
