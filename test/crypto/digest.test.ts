import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { base64urlEncode, base64urlDecode } from '../../src/crypto/digest.ts'

describe('base64url', () => {
  it('encodes correctly', () => {
    const input = new TextEncoder().encode('Hello, World!')
    const encoded = base64urlEncode(input)
    assert.equal(encoded, 'SGVsbG8sIFdvcmxkIQ')
  })

  it('decodes correctly', () => {
    const decoded = base64urlDecode('SGVsbG8sIFdvcmxkIQ')
    const text = new TextDecoder().decode(decoded)
    assert.equal(text, 'Hello, World!')
  })

  it('roundtrips', () => {
    const original = new Uint8Array([0, 1, 2, 3, 255, 254, 253])
    const encoded = base64urlEncode(original)
    const decoded = base64urlDecode(encoded)
    assert.deepEqual(decoded, original)
  })

  it('handles empty input', () => {
    const encoded = base64urlEncode(new Uint8Array(0))
    assert.equal(encoded, '')
    const decoded = base64urlDecode('')
    assert.equal(decoded.length, 0)
  })
})
