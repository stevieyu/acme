import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AcmeError, DnsProviderError } from '../../src/acme/errors.ts'

describe('AcmeError', () => {
  it('parses problem+json', () => {
    const err = AcmeError.fromResponse(403, JSON.stringify({
      type: 'urn:ietf:params:acme:error:unauthorized',
      detail: 'Account key not authorized',
    }))
    assert.equal(err.statusCode, 403)
    assert.equal(err.problem.type, 'urn:ietf:params:acme:error:unauthorized')
    assert.equal(err.problem.detail, 'Account key not authorized')
    assert.ok(err.message.includes('Account key not authorized'))
  })

  it('handles non-JSON error body', () => {
    const err = AcmeError.fromResponse(500, 'Internal Server Error')
    assert.equal(err.statusCode, 500)
    assert.equal(err.problem.detail, 'Internal Server Error')
  })
})

describe('DnsProviderError', () => {
  it('includes provider id in message', () => {
    const err = new DnsProviderError('rate limited', 'cf')
    assert.equal(err.providerId, 'cf')
    assert.ok(err.message.includes('[cf]'))
    assert.ok(err.message.includes('rate limited'))
  })
})
