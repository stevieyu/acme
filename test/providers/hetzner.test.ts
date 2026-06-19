import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { HetznerProvider } from '../../src/providers/hetzner.ts'
import { mockFetch, ctx as mkCtx, installMockFetch } from '../_shared.ts'

describe('Hetzner provider', () => {
  let restore: () => void

  beforeEach(() => {
    const m = mockFetch({
      'GET https://dns.hetzner.com/api/v1/zones?name=example.com': { zones: [{ id: 'zone-1', name: 'example.com' }] },
      'GET https://dns.hetzner.com/api/v1/records?zone_id=zone-1': { records: [{ id: 'r-1', value: 'test-value' }] },
      'POST https://dns.hetzner.com/api/v1/records': { record: { id: 'r-new' } },
      'DELETE https://dns.hetzner.com/api/v1/records/r-1': {},
    })
    restore = installMockFetch({ fetch: m.fetch as typeof globalThis.fetch })
  })

  afterEach(() => { restore() })

  it('requires token', () => {
    assert.throws(() => new HetznerProvider({ token: '' }), /token required/)
  })

  it('creates TXT record', async () => {
    const p = new HetznerProvider({ token: 'test-token' })
    await p.createTxtRecord(mkCtx(), { fulldomain: '_acme-challenge.example.com', txtvalue: 'new-value' })
  })

  it('deletes TXT record', async () => {
    const p = new HetznerProvider({ token: 'test-token' })
    await p.deleteTxtRecord(mkCtx(), { fulldomain: '_acme-challenge.example.com', txtvalue: 'test-value' })
  })
})
