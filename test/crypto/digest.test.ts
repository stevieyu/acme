import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { _url_replace, _durl_replace_base64 } from '../../src/crypto/digest.ts'

describe('base64url', () => {
  it('encodes correctly', () => {
    const input = new TextEncoder().encode('Hello, World!')
    const encoded = _url_replace(input)
    assert.equal(encoded, 'SGVsbG8sIFdvcmxkIQ')
  })

  it('decodes correctly', () => {
    const decoded = _durl_replace_base64('SGVsbG8sIFdvcmxkIQ')
    const text = new TextDecoder().decode(decoded)
    assert.equal(text, 'Hello, World!')
  })

  it('roundtrips', () => {
    const original = new Uint8Array([0, 1, 2, 3, 255, 254, 253])
    const encoded = _url_replace(original)
    const decoded = _durl_replace_base64(encoded)
    assert.deepEqual(decoded, original)
  })

  it('handles empty input', () => {
    const encoded = _url_replace(new Uint8Array(0))
    assert.equal(encoded, '')
    const decoded = _durl_replace_base64('')
    assert.equal(decoded.length, 0)
  })
})
