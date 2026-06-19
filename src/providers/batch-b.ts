import { HmacProviderBase } from './base-hmac.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

// ─── ME (Dynadot) ───────────────────────────────────────────────
export interface MeOptions { apiKey: string; username: string }
export class MeProvider extends HmacProviderBase {
  readonly id = 'me'; readonly name = 'Dynadot ME'
  private readonly apiKey: string
  private readonly username: string
  constructor(options: MeOptions) {
    super('https://api.dynadot.com/api3')
    if (!options.apiKey || !options.username) throw new DnsProviderError('apiKey and username required', 'me')
    this.apiKey = options.apiKey
    this.username = options.username
  }
  protected async buildSignedHeaders(): Promise<Record<string, string>> {
    const ts = Math.floor(Date.now() / 1000).toString()
    const sig = await this.hmacSign(new TextEncoder().encode(this.apiKey), ts)
    return { 'X-API-Key': this.apiKey, 'X-API-Signature': sig, 'X-API-Timestamp': ts }
  }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns`, { domain, hostname: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; content: string; hostname: string }> }>('GET', `${this.baseUrl}/dns?domain=${domain}`)
      const m = data.records?.find((x: { content: string; hostname: string }) => x.hostname === sub && x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns/${m.id}`)
    } catch {}
  }
}

// ─── Active24 ───────────────────────────────────────────────────
export interface Active24Options { apiKey: string; secret: string }
export class Active24Provider extends HmacProviderBase {
  readonly id = 'active24'; readonly name = 'Active24'
  private readonly apiKey: string
  private readonly secret: string
  constructor(options: Active24Options) {
    super('https://api.active24.com')
    if (!options.apiKey || !options.secret) throw new DnsProviderError('apiKey and secret required', 'active24')
    this.apiKey = options.apiKey
    this.secret = options.secret
  }
  protected async buildSignedHeaders(method: string, url: string): Promise<Record<string, string>> {
    const ts = Date.now().toString()
    const sig = await this.hmacSign(new TextEncoder().encode(this.secret), `${method}${url}${ts}`)
    return { 'Authorization': `Active24 ${this.apiKey}:${sig}:${ts}` }
  }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domain/${domain}/web/dns/record`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ hashId: string; content: string }>>('GET', `${this.baseUrl}/domain/${domain}/web/dns/record`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domain/${domain}/web/dns/record/${m.hashId}`)
    } catch {}
  }
}

// ─── Aurora DNS (PCExtreme) ─────────────────────────────────────
export interface AuroraOptions { apiKey: string; secret: string }
export class AuroraProvider extends HmacProviderBase {
  readonly id = 'aurora'; readonly name = 'Aurora DNS'
  private readonly apiKey: string
  private readonly secret: string
  constructor(options: AuroraOptions) {
    super('https://api.auroradns.eu')
    if (!options.apiKey || !options.secret) throw new DnsProviderError('apiKey and secret required', 'aurora')
    this.apiKey = options.apiKey
    this.secret = options.secret
  }
  protected async buildSignedHeaders(method: string, url: string, body?: unknown): Promise<Record<string, string>> {
    const date = new Date().toUTCString()
    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const hash = body ? await hashHex(JSON.stringify(body)) : ''
    const sig = await this.hmacSign(new TextEncoder().encode(this.secret), `${method}${path}${date}${hash}`)
    return { 'X-AuroraDNS-ApiKey': this.apiKey, 'X-AuroraDNS-Date': date, 'X-AuroraDNS-Signature': sig }
  }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/zones/${zoneId}/records`, { type: 'TXT', name, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<Array<{ id: string; content: string }>>('GET', `${this.baseUrl}/zones/${zoneId}/records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find(z => z.name === candidate)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'aurora')
  }
}

// ─── Exoscale ───────────────────────────────────────────────────
export interface ExoscaleOptions { apiKey: string; secretKey: string }
export class ExoscaleProvider extends HmacProviderBase {
  readonly id = 'exoscale'; readonly name = 'Exoscale DNS'
  private readonly apiKey: string
  private readonly secretKey: string
  constructor(options: ExoscaleOptions) {
    super('https://api.exoscale.com/dns/v1')
    if (!options.apiKey || !options.secretKey) throw new DnsProviderError('apiKey and secretKey required', 'exoscale')
    this.apiKey = options.apiKey
    this.secretKey = options.secretKey
  }
  protected async buildSignedHeaders(method: string, url: string): Promise<Record<string, string>> {
    const date = new Date().toUTCString()
    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const sig = await this.hmacSign(new TextEncoder().encode(this.secretKey), `${method}\n${path}\n${date}`)
    return { 'X-Auth-ApiKey': this.apiKey, 'X-Auth-Signature': sig, 'X-Auth-Expires': date }
  }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { record: { name: sub, record_type: 'TXT', content: r.txtvalue, ttl: 300 } })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: number; name: string; content: string; record_type: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.records?.find((x: { name: string; content: string; record_type: string }) => x.name === sub && x.content === r.txtvalue && x.record_type === 'TXT')
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}

// ─── Websupport ─────────────────────────────────────────────────
export interface WebsupportOptions { apiKey: string; secret: string }
export class WebsupportProvider extends HmacProviderBase {
  readonly id = 'websupport'; readonly name = 'Websupport'
  private readonly apiKey: string
  private readonly secret: string
  constructor(options: WebsupportOptions) {
    super('https://rest.websupport.sk/v1')
    if (!options.apiKey || !options.secret) throw new DnsProviderError('apiKey and secret required', 'websupport')
    this.apiKey = options.apiKey
    this.secret = options.secret
  }
  protected async buildSignedHeaders(method: string, url: string): Promise<Record<string, string>> {
    const ts = Math.floor(Date.now() / 1000).toString()
    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const canonical = `${method.toUpperCase()} ${path} ${ts}`
    const sig = await this.hmacSign(new TextEncoder().encode(this.secret), canonical)
    return { 'Authorization': `WS ${this.apiKey}:${sig}:${ts}` }
  }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/user/self/zone/${zoneId}/record`, { type: 'TXT', name, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ items: Array<{ id: number; content: string }> }>('GET', `${this.baseUrl}/user/self/zone/${zoneId}/record`)
      const items = data.items ?? []
      const m = items.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/user/self/zone/${zoneId}/record/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ items: Array<{ id: number; name: string }> }>('GET', `${this.baseUrl}/user/self/zone`)
    const zones = data.items ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find(z => z.name === candidate)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'websupport')
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

async function hashHex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  const bytes = new Uint8Array(hash)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}
