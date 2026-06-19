import { HttpProviderBase } from './base-http.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

// ─── DigitalOcean API (doapi) ───────────────────────────────────
export interface DoapiOptions { token: string }
export class DoapiProvider extends HttpProviderBase {
  readonly id = 'doapi'; readonly name = 'DO API'
  private readonly token: string
  constructor(options: DoapiOptions) {
    super('https://api.digitalocean.com/v2')
    if (!options.token) throw new DnsProviderError('token required', 'doapi')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ domain_records: Array<{ id: number; name: string; data: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.domain_records?.find((x: { name: string; data: string }) => x.name === sub && x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}

// ─── Namecheap ──────────────────────────────────────────────────
export interface NamecheapOptions { apiKey: string; user: string }
export class NamecheapProvider extends HttpProviderBase {
  readonly id = 'namecheap'; readonly name = 'Namecheap'
  private readonly apiKey: string
  private readonly user: string
  constructor(options: NamecheapOptions) {
    super('https://api.namecheap.com/xml.response')
    if (!options.apiKey || !options.user) throw new DnsProviderError('apiKey and user required', 'namecheap')
    this.apiKey = options.apiKey
    this.user = options.user
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private ncUrl(domain: string, action: string, params: Record<string, string>): string {
    const { domain: sld } = split2(domain)
    const tld = sld.split('.').pop() ?? ''
    const sldOnly = sld.split('.')[0] ?? sld
    const qs = new URLSearchParams({
      ApiKey: this.apiKey, ApiUser: this.user, UserName: this.user,
      Command: `namecheap.domains.dns.${action}`, ClientIp: '127.0.0.1',
      SLD: sldOnly, TLD: tld, ...params,
    })
    return `${this.baseUrl}?${qs}`
  }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const url = this.ncUrl(r.fulldomain, 'setHosts', {
      HostName1: split2(r.fulldomain).sub, RecordType1: 'TXT', Address1: r.txtvalue, TTL1: '300',
    })
    await fetch(url)
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try { await fetch(this.ncUrl(r.fulldomain, 'setHosts', {})) } catch {}
  }
}

// ─── Namesilo ───────────────────────────────────────────────────
export interface NamesiloOptions { apiKey: string }
export class NamesiloProvider extends HttpProviderBase {
  readonly id = 'namesilo'; readonly name = 'Namesilo'
  private readonly apiKey: string
  constructor(options: NamesiloOptions) {
    super('https://www.namesilo.com/api')
    if (!options.apiKey) throw new DnsProviderError('apiKey required', 'namesilo')
    this.apiKey = options.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ version: '1', type: 'json', key: this.apiKey, domain, rrhost: sub, rrvalue: r.txtvalue, rrttl: '3600' })
    await fetch(`${this.baseUrl}/dnsAddRecord?${params}`)
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const params = new URLSearchParams({ version: '1', type: 'json', key: this.apiKey, domain })
      const resp = await fetch(`${this.baseUrl}/dnsListRecords?${params}`)
      const data = await resp.json() as Record<string, unknown>
      const records = ((data.reply as Record<string, unknown>)?.resource_record ?? []) as Array<{ record_id: string; value: string }>
      const m = records.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) {
        const dp = new URLSearchParams({ version: '1', type: 'json', key: this.apiKey, domain, rrid: m.record_id })
        await fetch(`${this.baseUrl}/dnsDeleteRecord?${dp}`)
      }
    } catch {}
  }
}

// ─── OVH ────────────────────────────────────────────────────────
export interface OvhOptions { appKey: string; appSecret: string; consumerKey: string; consumerSecret: string }
export class OvhProvider extends HttpProviderBase {
  readonly id = 'ovh'; readonly name = 'OVH DNS'
  private readonly appKey: string
  private readonly appSecret: string
  private readonly consumerKey: string
  private readonly consumerSecret: string
  constructor(options: OvhOptions) {
    super('https://eu.api.ovh.com/1.0')
    if (!options.appKey || !options.appSecret || !options.consumerKey || !options.consumerSecret)
      throw new DnsProviderError('appKey, appSecret, consumerKey, consumerSecret required', 'ovh')
    this.appKey = options.appKey
    this.appSecret = options.appSecret
    this.consumerKey = options.consumerKey
    this.consumerSecret = options.consumerSecret
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Ovh-Application': this.appKey } }

  private async ovhRequest(method: string, path: string, body?: unknown): Promise<unknown> {
    const timestamp = Math.floor(Date.now() / 1000)
    const bodyStr = body ? JSON.stringify(body) : ''
    const toSign = `${this.appSecret}+${this.consumerSecret}+${method}+${this.baseUrl}${path}+${bodyStr}+${timestamp}`
    const sigBuf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign))
    const sigBytes = new Uint8Array(sigBuf)
    let hex = ''
    for (const b of sigBytes) hex += b.toString(16).padStart(2, '0')
    const signature = `$1$${hex}`

    const headers: Record<string, string> = {
      'X-Ovh-Application': this.appKey,
      'X-Ovh-Consumer': this.consumerKey,
      'X-Ovh-Signature': signature,
      'X-Ovh-Timestamp': String(timestamp),
    }
    if (body) headers['Content-Type'] = 'application/json'

    const response = await fetch(`${this.baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const data = await response.json()
    if (!response.ok) throw new DnsProviderError(`OVH API: ${JSON.stringify(data)}`, 'ovh')
    return data
  }

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.ovhRequest('POST', `/domain/zone/${domain}/record`, { fieldType: 'TXT', subDomain: sub, target: r.txtvalue, ttl: 300 })
    await this.ovhRequest('POST', `/domain/zone/${domain}/refresh`)
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const ids = await this.ovhRequest('GET', `/domain/zone/${domain}/record?fieldType=TXT&subDomain=${sub}`) as number[]
      for (const id of ids) {
        const rec = await this.ovhRequest('GET', `/domain/zone/${domain}/record/${id}`) as Record<string, unknown>
        if (rec.target === r.txtvalue) {
          await this.ovhRequest('DELETE', `/domain/zone/${domain}/record/${id}`)
          break
        }
      }
      await this.ovhRequest('POST', `/domain/zone/${domain}/refresh`)
    } catch {}
  }
}

// ─── INWX ───────────────────────────────────────────────────────
export interface InwxOptions { user: string; password: string }
export class InwxProvider extends HttpProviderBase {
  readonly id = 'inwx'; readonly name = 'INWX'
  private readonly user: string
  private readonly password: string
  constructor(options: InwxOptions) {
    super('https://api.domrobot.com/xmlrpc/')
    if (!options.user || !options.password) throw new DnsProviderError('user and password required', 'inwx')
    this.user = options.user
    this.password = options.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }

  private async inwxCall(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${this.user}:${this.password}`)}`,
    }
    const response = await fetch(this.baseUrl, {
      method: 'POST', headers,
      body: JSON.stringify({ method, params }),
    })
    const data = await response.json() as Record<string, unknown>
    const result = data.result as Record<string, unknown> | undefined
    if (result?.code && Number(result.code) !== 1000) {
      throw new DnsProviderError(`INWX error ${result.code}: ${result.msg ?? ''}`, 'inwx')
    }
    return result ?? {}
  }

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.inwxCall('nameserver.createRecord', { domain, name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const result = await this.inwxCall('nameserver.info', { domain, name: sub, type: 'TXT' })
      const records = ((result.record ?? []) as Array<{ id: number; content: string }>)
      const m = records.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.inwxCall('nameserver.deleteRecord', { id: m.id })
    } catch {}
  }
}

// ─── Loopia ─────────────────────────────────────────────────────
export interface LoopiaOptions { user: string; password: string }
export class LoopiaProvider extends HttpProviderBase {
  readonly id = 'loopia'; readonly name = 'Loopia DNS'
  private readonly auth: string
  constructor(options: LoopiaOptions) {
    super('https://api.loopia.se/RPCSERV')
    if (!options.user || !options.password) throw new DnsProviderError('user and password required', 'loopia')
    this.auth = `Basic ${btoa(`${options.user}:${options.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }

  private async loopiaCall(method: string, params: unknown[]): Promise<unknown> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': this.auth },
      body: JSON.stringify({ method, params }),
    })
    const data = await response.json()
    if (!response.ok) throw new DnsProviderError(`Loopia error: ${JSON.stringify(data)}`, 'loopia')
    return data
  }

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.loopiaCall('addZoneRecord', [this.auth, domain, sub, { type: 'TXT', data: r.txtvalue, ttl: 300 }])
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const records = await this.loopiaCall('getZoneRecords', [this.auth, domain, sub]) as Array<{ record_id: number; data: string }>
      const m = (records ?? []).find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.loopiaCall('removeZoneRecord', [this.auth, domain, sub, m.record_id])
    } catch {}
  }
}

// ─── helpers ────────────────────────────────────────────────────
function split2(fulldomain: string): { domain: string; sub: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) return { domain: fulldomain, sub: '@' }
  const domain = parts.slice(-2).join('.')
  const sub = parts.slice(0, -2).join('.')
  return { domain, sub: sub || '@' }
}
