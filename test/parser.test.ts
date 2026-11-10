import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import type { Uri } from 'vscode'
import { parseAdr } from '../src/core/parser'

const uri = {} as Uri

test('parseAdr reads frontmatter and the first paragraph', () => {
  const adr = parseAdr(
    [
      '---',
      'id: 42',
      'title: Adopt event sourcing',
      'status: Accepted',
      'deciders: ["@mika", tomasz]',
      'supersedes: ["17"]',
      'tags: architecture, orders',
      'applies-to:',
      '  - "src/orders/**"',
      '---',
      '',
      '## Context',
      '',
      'Orders need an audit trail',
      'across services.',
      '',
      'More text.',
    ].join('\n'),
    uri,
    'docs/adr/0042-adopt-event-sourcing.md',
  )
  assert.ok(adr)
  assert.equal(adr.id, '0042')
  assert.equal(adr.title, 'Adopt event sourcing')
  assert.equal(adr.status, 'accepted')
  assert.deepEqual(adr.deciders, ['mika', 'tomasz'])
  assert.deepEqual(adr.supersedes, ['0017'])
  assert.deepEqual(adr.tags, ['architecture', 'orders'])
  assert.deepEqual(adr.appliesTo, ['src/orders/**'])
  assert.equal(adr.summary, 'Orders need an audit trail across services.')
})

test('parseAdr falls back to the filename for id and title, and to proposed status', () => {
  const adr = parseAdr('Just a body.', uri, 'docs/adr/0007-use-postgres.md')
  assert.ok(adr)
  assert.equal(adr.id, '0007')
  assert.equal(adr.title, 'use postgres')
  assert.equal(adr.status, 'proposed')
})

test('parseAdr skips files without any id', () => {
  assert.equal(parseAdr('# Notes', uri, 'docs/adr/readme.md'), null)
})
