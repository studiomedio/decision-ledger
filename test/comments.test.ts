import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { commentMarkers, wrapComment } from '../src/core/comments'

test('wrapComment uses the language comment syntax', () => {
  assert.equal(wrapComment('typescript', 'dl:adr 0042'), '// dl:adr 0042')
  assert.equal(wrapComment('python', 'dl:adr 0042'), '# dl:adr 0042')
  assert.equal(wrapComment('sql', 'dl:adr 0042'), '-- dl:adr 0042')
  assert.equal(wrapComment('html', 'dl:adr 0042'), '<!-- dl:adr 0042 -->')
  assert.equal(wrapComment('css', 'dl:adr 0042'), '/* dl:adr 0042 */')
})

test('data formats have no comment syntax; unknown languages default to C style', () => {
  assert.deepEqual(commentMarkers('json'), { lines: [], blocks: [] })
  assert.deepEqual(commentMarkers('jsonc').lines, ['//'])
  assert.deepEqual(commentMarkers('some-new-language').lines, ['//'])
})
