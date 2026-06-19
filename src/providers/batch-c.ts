import { HttpProviderBase } from './base-http.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

function split2(fulldomain: string): { domain: string; sub: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) return { domain: fulldomain, sub: '@' }
  return { domain: parts.slice(-2).join('.'), sub: parts.slice(0, -2).join('.') || '@' }
}

// Macro-style factory for simple Bearer token providers
function mkBearer(id: string, name: string, baseUrl: string, headerName = 'Authorization', headerPrefix = 'Bearer ') {
  const iface = id + 'Options'
  const cls = id + 'Provider'
  return {
    iface, cls,
    create(token: string) {
      return new (class extends HttpProviderBase {
        readonly id = id; readonly name = name
        private readonly tok: string
        constructor() {
          super(baseUrl)
          if (!token) throw new DnsProviderError('token required', id)
          this.tok = token
        }
        protected buildAuthHeaders(): Record<string, string> { return { [headerName]: `${headerPrefix}${this.tok}` } }
        async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
          const { domain, sub } = split2(r.fulldomain)
          await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
        }
        async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
          const { domain, sub } = split2(r.fulldomain)
          try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
        }
      })()
    },
  }
}

// ─── Porkbun ────────────────────────────────────────────────────
export interface PorkbunOptions { apiKey: string; secretKey: string }
export class PorkbunProvider extends HttpProviderBase {
  readonly id = 'porkbun'; readonly name = 'Porkbun'
  private readonly apiKey: string; private readonly secretKey: string
  constructor(o: PorkbunOptions) {
    super('https://api.porkbun.com/api/json/v3')
    if (!o.apiKey || !o.secretKey) throw new DnsProviderError('apiKey and secretKey required', 'porkbun')
    this.apiKey = o.apiKey; this.secretKey = o.secretKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private pbBody(): Record<string, string> { return { secretapikey: this.secretKey, apikey: this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/create/${domain}`, { ...this.pbBody(), subdomain: sub, type: 'TXT', content: r.txtvalue, ttl: '300' })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; content: string; type: string }> }>('POST', `${this.baseUrl}/dns/retrieve/${domain}`, this.pbBody())
      const m = data.records?.find((x: { content: string; type: string }) => x.type === 'TXT' && x.content === r.txtvalue)
      if (m) await this.request('POST', `${this.baseUrl}/dns/delete/${domain}/${m.id}`, this.pbBody())
    } catch {}
  }
}

// ─── Bunny.net ──────────────────────────────────────────────────
export interface BunnyOptions { apiKey: string }
export class BunnyProvider extends HttpProviderBase {
  readonly id = 'bunny'; readonly name = 'Bunny.net DNS'
  private readonly apiKey: string
  constructor(o: BunnyOptions) {
    super('https://api.bunny.net')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'bunny')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'AccessKey': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('PUT', `${this.baseUrl}/dnszone/${zoneId}/records`, { Type: 3, Name: name, Value: r.txtvalue, Ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ Records: Array<{ Id: number; Value: string; Type: number }> }>('GET', `${this.baseUrl}/dnszone/${zoneId}`)
      const m = data.Records?.find((x: { Value: string; Type: number }) => x.Type === 3 && x.Value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dnszone/${zoneId}/records/${m.Id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ Items: Array<{ Id: number; Domain: string }> }>('GET', `${this.baseUrl}/dnszone`)
    const zones = data.Items ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.Domain === c)
      if (m) return String(m.Id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'bunny')
  }
}

// ─── ClouDNS ────────────────────────────────────────────────────
export interface CloudnsOptions { authId: string; authPassword: string }
export class CloudnsProvider extends HttpProviderBase {
  readonly id = 'cloudns'; readonly name = 'ClouDNS'
  private readonly authId: string; private readonly authPass: string
  constructor(o: CloudnsOptions) {
    super('https://api.cloudns.net')
    if (!o.authId || !o.authPassword) throw new DnsProviderError('authId and authPassword required', 'cloudns')
    this.authId = o.authId; this.authPass = o.authPassword
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private authParams(): string { return `auth-id=${this.authId}&auth-password=${this.authPass}` }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/add-record.json?${this.authParams()}`, { domain_name: domain, record_type: 'TXT', host: sub, record: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ id: string; record: string; type: string }>>(`GET`, `${this.baseUrl}/dns/records.json?${this.authParams()}&domain-name=${domain}&type=TXT`)
      const list = Array.isArray(data) ? data : Object.values(data as Record<string, unknown>) as Array<{ id: string; record: string; type: string }>
      const m = list.find((x: { record: string; type: string }) => x.type === 'TXT' && x.record === r.txtvalue)
      if (m) await this.request('POST', `${this.baseUrl}/dns/delete-record.json?${this.authParams()}`, { domain_name: domain, record_id: m.id })
    } catch {}
  }
}

// ─── Dynu ───────────────────────────────────────────────────────
export interface DynuOptions { apiKey: string }
export class DynuProvider extends HttpProviderBase {
  readonly id = 'dynu'; readonly name = 'Dynu DNS'
  private readonly apiKey: string
  constructor(o: DynuOptions) {
    super('https://api.dynu.com/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'dynu')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/dns/${zoneId}/record`, { recordType: 'TXT', hostname: r.fulldomain, nodeName: name, textData: r.txtvalue, state: true, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ dnsRecords: Array<{ id: number; textData: string }> }>('GET', `${this.baseUrl}/dns/${zoneId}/record`)
      const m = data.dnsRecords?.find((x: { textData: string }) => x.textData === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns/${zoneId}/record/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ domains: Array<{ id: number; name: string }> }>('GET', `${this.baseUrl}/dns`)
    const zones = data.domains ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'dynu')
  }
}

// ─── AcmeDNS ────────────────────────────────────────────────────
export interface AcmednsOptions { url: string; user: string; key: string; subdomain: string }
export class AcmednsProvider extends HttpProviderBase {
  readonly id = 'acmedns'; readonly name = 'acme-dns'
  private readonly user: string; private readonly key: string; private readonly sub: string
  constructor(o: AcmednsOptions) {
    super(o.url || 'https://auth.acme-dns.io')
    if (!o.user || !o.key || !o.subdomain) throw new DnsProviderError('user, key and subdomain required', 'acmedns')
    this.user = o.user; this.key = o.key; this.sub = o.subdomain
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-User': this.user, 'X-Api-Key': this.key } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await this.request('POST', `${this.baseUrl}/update`, { subdomain: this.sub, txt: r.txtvalue })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, _r: TxtRecordInput): Promise<void> {
    // acme-dns doesn't support deletion, just overwrite
  }
}

// ─── Dreamhost ──────────────────────────────────────────────────
export interface DreamhostOptions { apiKey: string }
export class DreamhostProvider extends HttpProviderBase {
  readonly id = 'dreamhost'; readonly name = 'DreamHost'
  private readonly apiKey: string
  constructor(o: DreamhostOptions) {
    super('https://api.dreamhost.com')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'dreamhost')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ key: this.apiKey, cmd: 'dns-add_record', record: r.fulldomain, type: 'TXT', value: r.txtvalue, format: 'json' })
    await fetch(`${this.baseUrl}/?${params}`)
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ key: this.apiKey, cmd: 'dns-remove_record', record: r.fulldomain, type: 'TXT', value: r.txtvalue, format: 'json' })
      await fetch(`${this.baseUrl}/?${params}`)
    } catch {}
  }
}

// ─── FreeDNS ────────────────────────────────────────────────────
export interface FreednsOptions { token: string }
export class FreednsProvider extends HttpProviderBase {
  readonly id = 'freedns'; readonly name = 'FreeDNS'
  private readonly token: string
  constructor(o: FreednsOptions) {
    super('https://freedns.afraid.org/api')
    if (!o.token) throw new DnsProviderError('token required', 'freedns')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await fetch(`${this.baseUrl}/?action=add&domain=${r.fulldomain}&type=TXT&value=${encodeURIComponent(r.txtvalue)}&token=${this.token}`)
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try { await fetch(`${this.baseUrl}/?action=delete&domain=${r.fulldomain}&token=${this.token}`) } catch {}
  }
}

// ─── Njalla ─────────────────────────────────────────────────────
export interface NjallaOptions { token: string }
export class NjallaProvider extends HttpProviderBase {
  readonly id = 'njalla'; readonly name = 'Njalla'
  private readonly token: string
  constructor(o: NjallaOptions) {
    super('https://app.njalla.im/1/')
    if (!o.token) throw new DnsProviderError('token required', 'njalla')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Njalla ${this.token}` } }
  private async njCall(method: string, params: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.request<{ result: unknown }>('POST', this.baseUrl, { method, params })
    return data.result
  }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.njCall('add-record', { name: domain, record: { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 } })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const result = await this.njCall('list-records', { name: domain }) as Array<{ id: number; content: string }>
      const m = (result ?? []).find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.njCall('remove-record', { name: domain, id: m.id })
    } catch {}
  }
}

// ─── Netlify ────────────────────────────────────────────────────
export interface NetlifyOptions { token: string }
export class NetlifyProvider extends HttpProviderBase {
  readonly id = 'netlify'; readonly name = 'Netlify DNS'
  private readonly token: string
  constructor(o: NetlifyOptions) {
    super('https://api.netlify.com/api/v1')
    if (!o.token) throw new DnsProviderError('token required', 'netlify')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const hostname = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/dns_zones/${zoneId}/dns_records`, { type: 'TXT', hostname, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<Array<{ id: string; value: string; type: string }>>('GET', `${this.baseUrl}/dns_zones/${zoneId}/dns_records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { value: string; type: string }) => x.type === 'TXT' && x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns_zones/${zoneId}/dns_records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/dns_zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'netlify')
  }
}

// ─── Vercel ─────────────────────────────────────────────────────
export interface VercelOptions { token: string; teamId?: string }
export class VercelProvider extends HttpProviderBase {
  readonly id = 'vercel'; readonly name = 'Vercel DNS'
  private readonly token: string; private readonly teamId: string
  constructor(o: VercelOptions) {
    super('https://api.vercel.com/v2')
    if (!o.token) throw new DnsProviderError('token required', 'vercel')
    this.token = o.token; this.teamId = o.teamId ?? ''
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  private teamQs(): string { return this.teamId ? `?teamId=${this.teamId}` : '' }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records${this.teamQs()}`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; value: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records${this.teamQs()}`)
      const m = data.records?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}${this.teamQs()}`)
    } catch {}
  }
}

// ─── TransIP ────────────────────────────────────────────────────
export interface TransipOptions { username: string; apiKey: string }
export class TransipProvider extends HttpProviderBase {
  readonly id = 'transip'; readonly name = 'TransIP'
  private readonly apiKey: string
  constructor(o: TransipOptions) {
    super('https://api.transip.nl/v6')
    if (!o.username || !o.apiKey) throw new DnsProviderError('username and apiKey required', 'transip')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/dns`, { name: sub, type: 'TXT', content: r.txtvalue, expire: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/dns`, { name: sub, type: 'TXT', content: r.txtvalue, expire: 300 }) } catch {}
  }
}

// ─── Scaleway ───────────────────────────────────────────────────
export interface ScalewayOptions { secretKey: string; projectId: string }
export class ScalewayProvider extends HttpProviderBase {
  readonly id = 'scaleway'; readonly name = 'Scaleway DNS'
  private readonly secretKey: string; private readonly projectId: string
  constructor(o: ScalewayOptions) {
    super('https://api.scaleway.com/domain/v2beta1')
    if (!o.secretKey || !o.projectId) throw new DnsProviderError('secretKey and projectId required', 'scaleway')
    this.secretKey = o.secretKey; this.projectId = o.projectId
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.secretKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns-zones/${domain}/records`, { name: sub, type: 'TXT', data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns-zones/${domain}/records/${sub}/TXT`) } catch {}
  }
}

// ─── Infomaniak ─────────────────────────────────────────────────
export interface InfomaniakOptions { token: string }
export class InfomaniakProvider extends HttpProviderBase {
  readonly id = 'infomaniak'; readonly name = 'Infomaniak'
  private readonly token: string
  constructor(o: InfomaniakOptions) {
    super('https://api.infomaniak.com/1')
    if (!o.token) throw new DnsProviderError('token required', 'infomaniak')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const source = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/domain/${zoneId}/dns/record`, { type: 'TXT', source, target: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ data: Array<{ id: number; target: string; type: string }> }>('GET', `${this.baseUrl}/domain/${zoneId}/dns/records`)
      const records = data.data ?? []
      const m = records.find((x: { target: string; type: string }) => x.type === 'TXT' && x.target === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domain/${zoneId}/dns/record/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: number; customer_name: string }> }>('GET', `${this.baseUrl}/domain`)
    const zones = data.data ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.customer_name === c)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'infomaniak')
  }
}

// ─── Selectel ───────────────────────────────────────────────────
export interface SelectelOptions { token: string }
export class SelectelProvider extends HttpProviderBase {
  readonly id = 'selectel'; readonly name = 'Selectel DNS'
  private readonly token: string
  constructor(o: SelectelOptions) {
    super('https://api.selectel.ru/domains/v1')
    if (!o.token) throw new DnsProviderError('token required', 'selectel')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Token': this.token } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const zoneId = await this.findZoneId(domain)
    await this.request('POST', `${this.baseUrl}/${zoneId}/records/`, { name: r.fulldomain, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const { domain } = split2(r.fulldomain)
      const zoneId = await this.findZoneId(domain)
      const { data } = await this.request<Array<{ id: number; content: string }>>('GET', `${this.baseUrl}/${zoneId}/records/`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: number; name: string }>>('GET', this.baseUrl)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'selectel')
  }
}

// ─── Spaceship ──────────────────────────────────────────────────
export interface SpaceshipOptions { apiKey: string; apiSecret: string }
export class SpaceshipProvider extends HttpProviderBase {
  readonly id = 'spaceship'; readonly name = 'Spaceship DNS'
  private readonly apiKey: string; private readonly apiSecret: string
  constructor(o: SpaceshipOptions) {
    super('https://api.spaceship.dev/v1')
    if (!o.apiKey || !o.apiSecret) throw new DnsProviderError('apiKey and apiSecret required', 'spaceship')
    this.apiKey = o.apiKey; this.apiSecret = o.apiSecret
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-Key': this.apiKey, 'X-Api-Secret': this.apiSecret } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/records/${domain}`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/records/${domain}/TXT/${r.fulldomain}`) } catch {}
  }
}

// ─── Zonomi / RimuHosting ───────────────────────────────────────
export interface ZonomiOptions { apiKey: string }
export class ZonomiProvider extends HttpProviderBase {
  readonly id = 'zonomi'; readonly name = 'Zonomi'
  private readonly apiKey: string
  constructor(o: ZonomiOptions) {
    super('https://api.zonomi.com/app')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'zonomi')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ api_key: this.apiKey, action: 'SET', name: r.fulldomain, type: 'TXT', content: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/dns/dyndns.jsp?${params}`)
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ api_key: this.apiKey, action: 'DELETE', name: r.fulldomain, type: 'TXT' })
      await fetch(`${this.baseUrl}/dns/dyndns.jsp?${params}`)
    } catch {}
  }
}

// ─── Rackspace ──────────────────────────────────────────────────
export interface RackspaceOptions { username: string; apiKey: string }
export class RackspaceProvider extends HttpProviderBase {
  readonly id = 'rackspace'; readonly name = 'Rackspace DNS'
  private readonly username: string; private readonly apiKey: string; private authToken = ''
  constructor(o: RackspaceOptions) {
    super('https://dns.api.rackspacecloud.com/v1.0')
    if (!o.username || !o.apiKey) throw new DnsProviderError('username and apiKey required', 'rackspace')
    this.username = o.username; this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.authToken } }
  private async auth(): Promise<void> {
    if (this.authToken) return
    const resp = await fetch('https://identity.api.rackspacecloud.com/v2.0/tokens', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth: { 'RAX-KSKEY:apiKeyCredentials': { username: this.username, apiKey: this.apiKey } } }),
    })
    const data = await resp.json() as Record<string, unknown>
    this.authToken = ((data.access as Record<string, unknown>)?.token as Record<string, string>)?.id ?? ''
  }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await this.auth()
    const { domain, sub } = split2(r.fulldomain)
    const zoneId = await this.findZoneId(domain)
    await this.request('POST', `${this.baseUrl}/${zoneId}/records`, { records: [{ name: r.fulldomain, type: 'TXT', data: r.txtvalue, ttl: 300 }] })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      await this.auth()
      const { domain } = split2(r.fulldomain)
      const zoneId = await this.findZoneId(domain)
      const { data } = await this.request<{ records: Array<{ id: string; data: string }> }>('GET', `${this.baseUrl}/${zoneId}/records?type=TXT`)
      const m = data.records?.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ domains: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/domains`)
    const zones = data.domains ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'rackspace')
  }
}

// ─── HetznerCloud ───────────────────────────────────────────────
export interface HetznercloudOptions { token: string }
export class HetznercloudProvider extends HttpProviderBase {
  readonly id = 'hetznercloud'; readonly name = 'Hetzner Cloud DNS'
  private readonly token: string
  constructor(o: HetznercloudOptions) {
    super('https://dns.hetzner.com/api/v1')
    if (!o.token) throw new DnsProviderError('token required', 'hetznercloud')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Auth-Token': this.token } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1))
    await this.request('POST', `${this.baseUrl}/records`, { type: 'TXT', name, value: r.txtvalue, ttl: 60, zone_id: zoneId })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ records: Array<{ id: string; value: string }> }>('GET', `${this.baseUrl}/records?zone_id=${zoneId}`)
      const m = data.records?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      try {
        const { data } = await this.request<{ zones: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/zones?name=${encodeURIComponent(c)}`)
        if (data.zones?.length) return data.zones[0]!.id
      } catch {}
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'hetznercloud')
  }
}

// ─── OCI (Oracle Cloud) ────────────────────────────────────────
export interface OciOptions { tenancyId: string; userId: string; fingerprint: string; privateKey: string; compartmentId: string }
export class OciProvider extends HttpProviderBase {
  readonly id = 'oci'; readonly name = 'Oracle Cloud DNS'
  private readonly tenancyId: string; private readonly userId: string; private readonly fingerprint: string
  private readonly privateKey: string; private readonly compartmentId: string
  constructor(o: OciOptions) {
    super('https://dns.' + 'oci.oraclecloud.com/20180115')
    if (!o.tenancyId || !o.userId || !o.fingerprint || !o.privateKey || !o.compartmentId)
      throw new DnsProviderError('all OCI options required', 'oci')
    this.tenancyId = o.tenancyId; this.userId = o.userId; this.fingerprint = o.fingerprint
    this.privateKey = o.privateKey; this.compartmentId = o.compartmentId
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Signature version="1",keyId="${this.tenancyId}/${this.userId}/${this.fingerprint}",algorithm="rsa-sha256",headers="date (request-target) host content-length content-type x-content-sha256",signature="placeholder"` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PATCH', `${this.baseUrl}/zones/${domain}/records`, { items: [{ domain: r.fulldomain, rtype: 'TXT', rdata: `"${r.txtvalue}"`, ttl: 300 }], compartmentId: this.compartmentId })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/${r.fulldomain}/TXT`) } catch {}
  }
}

// ─── HuaweiCloud ────────────────────────────────────────────────
export interface HuaweicloudOptions { accessKeyId: string; secretAccessKey: string }
export class HuaweicloudProvider extends HttpProviderBase {
  readonly id = 'huaweicloud'; readonly name = 'Huawei Cloud DNS'
  private readonly akId: string; private readonly akSecret: string
  constructor(o: HuaweicloudOptions) {
    super('https://dns.myhuaweicloud.com/v2')
    if (!o.accessKeyId || !o.secretAccessKey) throw new DnsProviderError('accessKeyId and secretAccessKey required', 'huaweicloud')
    this.akId = o.accessKeyId; this.akSecret = o.secretAccessKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.akId } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${zoneId}/recordsets`, { name: `${r.fulldomain}.`, type: 'TXT', records: [`"${r.txtvalue}"`], ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ recordsets: Array<{ id: string; records: string[] }> }>('GET', `${this.baseUrl}/zones/${zoneId}/recordsets?type=TXT`)
      const m = data.recordsets?.find((x: { records: string[] }) => x.records.includes(`"${r.txtvalue}"`))
      if (m) await this.request('DELETE', `${this.baseUrl}/zones/${zoneId}/recordsets/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ zones: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/zones`)
    const zones = data.zones ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === `${c}.`)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'huaweicloud')
  }
}

// ─── Dyn (Oracle Dyn DNS) ──────────────────────────────────────
export interface DynOptions { customer: string; username: string; password: string }
export class DynProvider extends HttpProviderBase {
  readonly id = 'dyn'; readonly name = 'Dyn DNS'
  private readonly customer: string; private readonly username: string; private readonly password: string
  private token = ''
  constructor(o: DynOptions) {
    super('https://api.dynect.net/REST')
    if (!o.customer || !o.username || !o.password) throw new DnsProviderError('customer, username and password required', 'dyn')
    this.customer = o.customer; this.username = o.username; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return this.token ? { 'Auth-Token': this.token } : {} }
  private async auth(): Promise<void> {
    if (this.token) return
    const { data } = await this.request<{ data: { token: string } }>('POST', `${this.baseUrl}/Session/`, { customer_name: this.customer, user_name: this.username, password: this.password })
    this.token = data.data.token
  }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await this.auth()
    const { domain } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/TXTRecord/${domain}/${r.fulldomain}/`, { rdata: { txtdata: r.txtvalue }, ttl: 300 })
    await this.request('PUT', `${this.baseUrl}/Zone/${domain}/`, { publish: true })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      await this.auth()
      const { domain } = split2(r.fulldomain)
      await this.request('DELETE', `${this.baseUrl}/TXTRecord/${domain}/${r.fulldomain}/`)
      await this.request('PUT', `${this.baseUrl}/Zone/${domain}/`, { publish: true })
    } catch {}
  }
}

// ─── Simply.com ─────────────────────────────────────────────────
export interface SimplyOptions { accountName: string; apiKey: string }
export class SimplyProvider extends HttpProviderBase {
  readonly id = 'simply'; readonly name = 'Simply.com'
  private readonly accountName: string; private readonly apiKey: string
  constructor(o: SimplyOptions) {
    super('https://api.simply.com/1')
    if (!o.accountName || !o.apiKey) throw new DnsProviderError('accountName and apiKey required', 'simply')
    this.accountName = o.accountName; this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Basic ${btoa(`${this.accountName}:${this.apiKey}`)}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/${this.accountName}/${domain}/dns/records`, { name: sub, type: 'TXT', data: r.txtvalue, ttl: 300, priority: 0 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ record_id: number; data: string }> }>('GET', `${this.baseUrl}/${this.accountName}/${domain}/dns/records`)
      const m = data.records?.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${this.accountName}/${domain}/dns/records/${m.record_id}`)
    } catch {}
  }
}

// ─── Timeweb ────────────────────────────────────────────────────
export interface TimewebOptions { token: string }
export class TimewebProvider extends HttpProviderBase {
  readonly id = 'timeweb'; readonly name = 'Timeweb'
  private readonly token: string
  constructor(o: TimewebOptions) {
    super('https://api.timeweb.cloud/api/v1')
    if (!o.token) throw new DnsProviderError('token required', 'timeweb')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/dns-records`, { type: 'TXT', subdomain: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ dns_records: Array<{ id: string; value: string }> }>('GET', `${this.baseUrl}/domains/${domain}/dns-records`)
      const m = data.dns_records?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/dns-records/${m.id}`)
    } catch {}
  }
}

// ─── Leaseweb ───────────────────────────────────────────────────
export interface LeasewebOptions { apiKey: string }
export class LeasewebProvider extends HttpProviderBase {
  readonly id = 'leaseweb'; readonly name = 'Leaseweb DNS'
  private readonly apiKey: string
  constructor(o: LeasewebOptions) {
    super('https://api.leaseweb.com/hosting/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'leaseweb')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-LSW-Auth': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/resourceRecordSets`, { name: sub, type: 'TXT', content: [r.txtvalue], ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/resourceRecordSets/${sub}/TXT`) } catch {}
  }
}

// ─── Hostup ─────────────────────────────────────────────────────
export interface HostupOptions { token: string }
export class HostupProvider extends HttpProviderBase {
  readonly id = 'hostup'; readonly name = 'HostUp'
  private readonly token: string
  constructor(o: HostupOptions) {
    super('https://api.hostup.io/v1')
    if (!o.token) throw new DnsProviderError('token required', 'hostup')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Internet.bs ────────────────────────────────────────────────
export interface InternetbsOptions { apiKey: string; password: string }
export class InternetbsProvider extends HttpProviderBase {
  readonly id = 'internetbs'; readonly name = 'Internet.bs'
  private readonly apiKey: string; private readonly password: string
  constructor(o: InternetbsOptions) {
    super('https://api.internet.bs')
    if (!o.apiKey || !o.password) throw new DnsProviderError('apiKey and password required', 'internetbs')
    this.apiKey = o.apiKey; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ ApiKey: this.apiKey, Password: this.password, Action: 'Domain/DnsRecord/Add', Domain: domain, Name: sub, Type: 'TXT', Value: r.txtvalue, TTL: '300', ResponseFormat: 'JSON' })
    await fetch(`${this.baseUrl}/?${params}`)
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const params = new URLSearchParams({ ApiKey: this.apiKey, Password: this.password, Action: 'Domain/DnsRecord/Remove', Domain: domain, Name: sub, Type: 'TXT', Value: r.txtvalue, ResponseFormat: 'JSON' })
      await fetch(`${this.baseUrl}/?${params}`)
    } catch {}
  }
}

// ─── Reg.ru ─────────────────────────────────────────────────────
export interface RegruOptions { username: string; password: string }
export class RegruProvider extends HttpProviderBase {
  readonly id = 'regru'; readonly name = 'Reg.ru'
  private readonly username: string; private readonly password: string
  constructor(o: RegruOptions) {
    super('https://api.reg.ru/api/regru2')
    if (!o.username || !o.password) throw new DnsProviderError('username and password required', 'regru')
    this.username = o.username; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ username: this.username, password: this.password, input_format: 'json', input_data: JSON.stringify({ domain: { dname: domain }, subdomain: sub, content: r.txtvalue, record_type: 'TXT', ttl: 300 }) })
    await fetch(`${this.baseUrl}/zone/add_record?${params}`)
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const params = new URLSearchParams({ username: this.username, password: this.password, input_format: 'json', input_data: JSON.stringify({ domain: { dname: domain }, content: r.txtvalue, record_type: 'TXT' }) })
      await fetch(`${this.baseUrl}/zone/delete_record?${params}`)
    } catch {}
  }
}

// ─── Veesp ──────────────────────────────────────────────────────
export interface VeespOptions { token: string }
export class VeespProvider extends HttpProviderBase {
  readonly id = 'veesp'; readonly name = 'Veesp DNS'
  private readonly token: string
  constructor(o: VeespOptions) {
    super('https://api.veesp.com/v1')
    if (!o.token) throw new DnsProviderError('token required', 'veesp')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Zilore ─────────────────────────────────────────────────────
export interface ZiloreOptions { apiKey: string }
export class ZiloreProvider extends HttpProviderBase {
  readonly id = 'zilore'; readonly name = 'Zilore DNS'
  private readonly apiKey: string
  constructor(o: ZiloreOptions) {
    super('https://api.zilore.com/dns/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'zilore')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/domains/${domain}/records?record_name=${sub}&record_type=TXT&record_value=${encodeURIComponent(r.txtvalue)}&record_ttl=300`)
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records?record_name=${sub}&record_type=TXT&record_value=${encodeURIComponent(r.txtvalue)}`) } catch {}
  }
}

// ─── Zone (zone.eu) ─────────────────────────────────────────────
export interface ZoneOptions { apiKey: string }
export class ZoneProvider extends HttpProviderBase {
  readonly id = 'zone'; readonly name = 'Zone.eu'
  private readonly apiKey: string
  constructor(o: ZoneOptions) {
    super('https://api.zone.eu/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'zone')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dnszones/${domain}/dnstxtrecords`, { hostname: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ id: string; value: string }>>('GET', `${this.baseUrl}/dnszones/${domain}/dnstxtrecords`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dnszones/${domain}/dnstxtrecords/${m.id}`)
    } catch {}
  }
}
