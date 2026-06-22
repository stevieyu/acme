import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { getProvider } from '../../src/dnsapi/index.ts'
import { mockFetch, ctx, installMockFetch } from '../_shared.ts'

describe('Cloudflare provider', () => {
  let restore: (() => void) | null = null

  afterEach(() => {
    if (restore) { restore(); restore = null }
  })

  it('creates TXT record with Bearer token', async () => {
    const http = mockFetch({
      'zones?name=example.com':
        { success: true, result: [{ id: 'zone1', name: 'example.com' }] },
      'zones/zone1/dns_records?type=TXT':
        { success: true, result: [] },
      'POST https://api.cloudflare.com/client/v4/zones/zone1/dns_records':
        { success: true, result: { id: 'rec1' } },
    })
    restore = installMockFetch(http)

    const cf = getProvider('cf', { token: 'test-token' })
    cf.setContext(ctx())
    await cf.createTxtRecord({
      fulldomain: '_acme-challenge.example.com',
      txtvalue: 'CHALLENGE_VALUE',
    })

    // Verify auth header
    const authCall = http.calls.find(c => c.url.includes('zones/zone1/dns_records') && c.method === 'POST')
    assert.ok(authCall)
    assert.equal(authCall.headers.authorization, 'Bearer test-token')
  })

  it('skips create if record already exists', async () => {
    const http = mockFetch({
      'zones?name=example.com':
        { success: true, result: [{ id: 'zone1', name: 'example.com' }] },
      'zones/zone1/dns_records?type=TXT':
        { success: true, result: [{ id: 'existing1', name: '_acme-challenge.example.com', content: 'EXISTING' }] },
    })
    restore = installMockFetch(http)

    const cf = getProvider('cf', { token: 'test-token' })
    cf.setContext(ctx())
    await cf.createTxtRecord({
      fulldomain: '_acme-challenge.example.com',
      txtvalue: 'EXISTING',
    })

    // Should not have called POST
    const postCalls = http.calls.filter(c => c.method === 'POST')
    assert.equal(postCalls.length, 0)
  })

  it('delete succeeds silently when record not found', async () => {
    const http = mockFetch({
      'zones?name=example.com':
        { success: true, result: [{ id: 'zone1', name: 'example.com' }] },
      'zones/zone1/dns_records?type=TXT':
        { success: true, result: [] },
    })
    restore = installMockFetch(http)

    const cf = getProvider('cf', { token: 'test-token' })
    cf.setContext(ctx())
    await cf.deleteTxtRecord({
      fulldomain: '_acme-challenge.example.com',
      txtvalue: 'NOT_EXISTING',
    })

    // Should not have called DELETE
    const deleteCalls = http.calls.filter(c => c.method === 'DELETE')
    assert.equal(deleteCalls.length, 0)
  })

  it('requires token or key+email', () => {
    assert.throws(() => getProvider('cf', {}), {
      message: /Either token or key\+email required/,
    })
  })
})
