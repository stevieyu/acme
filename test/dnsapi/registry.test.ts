import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { getProvider } from '../../src/dnsapi/index.ts'
import { mockFetch, ctx as mkCtx, installMockFetch } from '../_shared.ts'
import { CloudflareProvider } from '../../src/dnsapi/dns_cf.ts'
import { VultrProvider } from '../../src/dnsapi/dns_vultr.ts'
import { TencentProvider } from '../../src/dnsapi/dns_tencent.ts'
import { PorkbunProvider } from '../../src/dnsapi/dns_porkbun.ts'

describe('getProvider registry', () => {
  it('creates cf provider', () => {
    const p = getProvider('cf', { token: 't' })
    assert.ok(p)
    assert.equal(p.id, 'cf')
  })

  it('creates hetzner provider', () => {
    const p = getProvider('hetzner', { token: 't' })
    assert.ok(p)
    assert.equal(p.id, 'hetzner')
  })

  it('creates vultr provider', () => {
    const p = getProvider('vultr', { token: 't' })
    assert.ok(p)
    assert.equal(p.id, 'vultr')
  })

  it('creates tencent provider', () => {
    const p = getProvider('tencent', { secretId: 'id', secretKey: 'key' })
    assert.ok(p)
    assert.equal(p.id, 'tencent')
  })

  it('creates porkbun provider', () => {
    const p = getProvider('porkbun', { apiKey: 'k', secretKey: 's' })
    assert.ok(p)
    assert.equal(p.id, 'porkbun')
  })

  it('throws for unknown provider', () => {
    assert.throws(() => getProvider('unknown' as 'cf', {} as { token: string }), /Unknown provider/)
  })
})

describe('Vultr provider', () => {
  let restore: () => void

  beforeEach(() => {
    const m = mockFetch({
      'POST https://api.vultr.com/v2/domains/example.com/records': { record: {} },
      'GET https://api.vultr.com/v2/domains/example.com/records': { records: [{ id: 'r1', name: '_acme-challenge', data: 'val' }] },
      'DELETE https://api.vultr.com/v2/domains/example.com/records/r1': {},
    })
    restore = installMockFetch({ fetch: m.fetch as typeof globalThis.fetch })
  })

  afterEach(() => { restore() })

  it('requires token', () => {
    assert.throws(() => new VultrProvider({ token: '' }), /token required/)
  })

  it('creates TXT record', async () => {
    const p = new VultrProvider({ token: 'tok' })
    p.setContext(mkCtx())
    await p.createTxtRecord({ fulldomain: '_acme-challenge.example.com', txtvalue: 'val' })
  })

  it('deletes TXT record', async () => {
    const p = new VultrProvider({ token: 'tok' })
    p.setContext(mkCtx())
    await p.deleteTxtRecord({ fulldomain: '_acme-challenge.example.com', txtvalue: 'val' })
  })
})

describe('Tencent provider', () => {
  let restore: () => void

  beforeEach(() => {
    const m = mockFetch({
      'POST https://dnspod.tencentcloudapi.com': { Response: { RecordId: '123', RequestId: 'req-1' } },
    })
    restore = installMockFetch({ fetch: m.fetch as typeof globalThis.fetch })
  })

  afterEach(() => { restore() })

  it('requires secrets', () => {
    assert.throws(() => new TencentProvider({ secretId: '', secretKey: '' }), /secretId and secretKey required/)
  })

  it('creates TXT record', async () => {
    const p = new TencentProvider({ secretId: 'id', secretKey: 'key' })
    p.setContext(mkCtx())
    await p.createTxtRecord({ fulldomain: '_acme-challenge.example.com', txtvalue: 'val' })
  })
})

describe('Porkbun provider', () => {
  let restore: () => void

  beforeEach(() => {
    const m = mockFetch({
      'POST https://api.porkbun.com/api/json/v3/dns/create/example.com': { status: 'SUCCESS' },
      'POST https://api.porkbun.com/api/json/v3/dns/retrieve/example.com': { records: [{ id: '1', content: 'val', type: 'TXT' }] },
      'POST https://api.porkbun.com/api/json/v3/dns/delete/example.com/1': { status: 'SUCCESS' },
    })
    restore = installMockFetch({ fetch: m.fetch as typeof globalThis.fetch })
  })

  afterEach(() => { restore() })

  it('requires keys', () => {
    assert.throws(() => new PorkbunProvider({ apiKey: '', secretKey: '' }), /apiKey and secretKey required/)
  })

  it('creates TXT record', async () => {
    const p = new PorkbunProvider({ apiKey: 'k', secretKey: 's' })
    p.setContext(mkCtx())
    await p.createTxtRecord({ fulldomain: '_acme-challenge.example.com', txtvalue: 'val' })
  })

  it('deletes TXT record', async () => {
    const p = new PorkbunProvider({ apiKey: 'k', secretKey: 's' })
    p.setContext(mkCtx())
    await p.deleteTxtRecord({ fulldomain: '_acme-challenge.example.com', txtvalue: 'val' })
  })
})
