import { HttpProviderBase } from './base-http.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

// Vultr DNS
export interface VultrOptions { token: string }
export class VultrProvider extends HttpProviderBase {
  readonly id = 'vultr'; readonly name = 'Vultr'
  private readonly token: string
  constructor(options: VultrOptions) {
    super('https://api.vultr.com/v2')
    if (!options.token) throw new DnsProviderError('token required', 'vultr')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { name: sub, type: 'TXT', data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; name: string; data: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.records?.find((x: { name: string; data: string }) => x.name === sub && x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}

// DigitalOcean DNS
export interface DgonOptions { token: string }
export class DgonProvider extends HttpProviderBase {
  readonly id = 'dgon'; readonly name = 'DigitalOcean'
  private readonly token: string
  constructor(options: DgonOptions) {
    super('https://api.digitalocean.com/v2')
    if (!options.token) throw new DnsProviderError('token required', 'dgon')
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

// Linode v4 DNS
export interface LinodeV4Options { token: string }
export class LinodeV4Provider extends HttpProviderBase {
  readonly id = 'linode_v4'; readonly name = 'Linode v4'
  private readonly token: string
  constructor(options: LinodeV4Options) {
    super('https://api.linode.com/v4')
    if (!options.token) throw new DnsProviderError('token required', 'linode_v4')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const sub = r.fulldomain.slice(0, -(domain.length + 1))
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/records`, { type: 'TXT', name: sub, target: r.txtvalue, ttl_sec: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const sub = r.fulldomain.slice(0, -(domain.length + 1))
    try {
      const { data } = await this.request<{ data: Array<{ id: number; name: string; target: string }> }>('GET', `${this.baseUrl}/domains/${zoneId}/records`)
      const m = data.data?.find((x: { name: string; target: string }) => x.name === sub && x.target === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<number> {
    const { data } = await this.request<{ data: Array<{ id: number; domain: string }> }>('GET', `${this.baseUrl}/domains`)
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = data.data?.find((z: { domain: string }) => z.domain === candidate)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'linode_v4')
  }
}

// Gandi LiveDNS
export interface GandiLiveDnsOptions { token: string }
export class GandiLiveDnsProvider extends HttpProviderBase {
  readonly id = 'gandi_livedns'; readonly name = 'Gandi LiveDNS'
  private readonly token: string
  constructor(options: GandiLiveDnsOptions) {
    super('https://api.gandi.net/v5/livedns')
    if (!options.token) throw new DnsProviderError('token required', 'gandi_livedns')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/domains/${domain}/records/${sub}/TXT`, { rrset_values: [r.txtvalue], rrset_ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${sub}/TXT`) } catch {}
  }
}

// deSEC
export interface DesecOptions { token: string }
export class DesecProvider extends HttpProviderBase {
  readonly id = 'desec'; readonly name = 'deSEC'
  private readonly token: string
  constructor(options: DesecOptions) {
    super('https://desec.io/api/v1')
    if (!options.token) throw new DnsProviderError('token required', 'desec')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Token ${this.token}` } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PATCH', `${this.baseUrl}/domains/${domain}/rrsets/`, [{ subname: sub, type: 'TXT', records: [`"${r.txtvalue}"`], ttl: 300 }])
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('PATCH', `${this.baseUrl}/domains/${domain}/rrsets/`, [{ subname: sub, type: 'TXT', records: [] }]) } catch {}
  }
}

// G-Core DNS
export interface GcoreOptions { token: string }
export class GcoreProvider extends HttpProviderBase {
  readonly id = 'gcore'; readonly name = 'G-Core DNS'
  private readonly token: string
  constructor(options: GcoreOptions) {
    super('https://api.gcore.com/dns')
    if (!options.token) throw new DnsProviderError('token required', 'gcore')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `APIKey ${this.token}` } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/v2/zones/${domain}/records`, { type: 'TXT', name: sub, content: [r.txtvalue], ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/v2/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// GoDaddy
export interface GdOptions { key: string; secret: string }
export class GdProvider extends HttpProviderBase {
  readonly id = 'gd'; readonly name = 'GoDaddy'
  private readonly authHeader: string
  constructor(options: GdOptions) {
    super('https://api.godaddy.com/v1')
    if (!options.key || !options.secret) throw new DnsProviderError('key and secret required', 'gd')
    this.authHeader = `sso-key ${options.key}:${options.secret}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.authHeader } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/v1/domains/${domain}/records/TXT/${sub}`, [{ data: r.txtvalue, ttl: 600 }])
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/v1/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// IONOS
export interface IonosOptions { apiKey: string }
export class IonosProvider extends HttpProviderBase {
  readonly id = 'ionos'; readonly name = 'IONOS'
  private readonly apiKey: string
  constructor(options: IonosOptions) {
    super('https://api.hosting.ionos.com/dns')
    if (!options.apiKey) throw new DnsProviderError('apiKey required', 'ionos')
    this.apiKey = options.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/v1/zones/${zoneId}/records`, { type: 'TXT', name: r.fulldomain, content: r.txtvalue, ttl: 300, disabled: false })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ id: string; name: string; content: string }>>('GET', `${this.baseUrl}/v1/zones/${zoneId}`)
      const records = Array.isArray(data) ? data : []
      const m = records.find((x: { name: string; content: string }) => x.name === r.fulldomain && x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/v1/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/v1/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find((z: { name: string }) => z.name === candidate)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'ionos')
  }
}

function split2(fulldomain: string): { domain: string; sub: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) return { domain: fulldomain, sub: '@' }
  const domain = parts.slice(-2).join('.')
  const sub = parts.slice(0, -2).join('.')
  return { domain, sub: sub || '@' }
}
