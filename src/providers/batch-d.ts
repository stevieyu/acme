import { HttpProviderBase } from './base-http.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

function s2(fulldomain: string): { domain: string; sub: string } {
  const p = fulldomain.split('.')
  if (p.length <= 2) return { domain: fulldomain, sub: '@' }
  return { domain: p.slice(-2).join('.'), sub: p.slice(0, -2).join('.') || '@' }
}

// Macro: simple Bearer/Token REST providers with zone-based API
function mkSimple(id: string, name: string, baseUrl: string, authFn: (tok: string) => Record<string, string>,
  createPath: (d: string, s: string) => string, deletePath: (d: string, s: string) => string,
  bodyFn: (v: string) => Record<string, unknown>) {
  abstract class Base extends HttpProviderBase {
    readonly id = id; readonly name = name
    protected readonly tok: string
    constructor(token: string) {
      super(baseUrl)
      if (!token) throw new DnsProviderError('token required', id)
      this.tok = token
    }
    protected buildAuthHeaders(): Record<string, string> { return authFn(this.tok) }
    async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
      const { domain, sub } = s2(r.fulldomain)
      await this.request('POST', createPath(domain, sub), bodyFn(r.txtvalue))
    }
    async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
      const { domain, sub } = s2(r.fulldomain)
      try { await this.request('DELETE', deletePath(domain, sub)) } catch {}
    }
  }
  return Base
}

// ─── 1984hosting ────────────────────────────────────────────────
export interface Nineteen84Options { user: string; password: string }
export class Nineteen84Provider extends HttpProviderBase {
  readonly id = '1984hosting'; readonly name = '1984 Hosting'
  private readonly user: string; private readonly password: string; private cookies = ''
  constructor(o: Nineteen84Options) {
    super('https://1984.hosting/api')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', '1984hosting')
    this.user = o.user; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return this.cookies ? { 'Cookie': this.cookies } : {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/record`, { zone: domain, host: sub, type: 'TXT', rdata: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/record/${domain}/TXT`) } catch {}
  }
}

// ─── Arvan Cloud ────────────────────────────────────────────────
export interface ArvanOptions { apiKey: string }
export class ArvanProvider extends HttpProviderBase {
  readonly id = 'arvan'; readonly name = 'Arvan Cloud'
  private readonly apiKey: string
  constructor(o: ArvanOptions) {
    super('https://api.arvancloud.ir/cdn/4.0')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'arvan')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Apikey ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    const { domain } = s2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/dns-records`, { type: 'TXT', name, value: { text: r.txtvalue }, ttl: 120 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<{ data: Array<{ id: string; value: Record<string, string> }> }>('GET', `${this.baseUrl}/domains/${zoneId}/dns-records`)
      const m = data.data?.find((x: { value: Record<string, string> }) => x.value.text === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${zoneId}/dns-records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/domains`)
    const zones = data.data ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'arvan')
  }
}

// ─── AutoDNS ────────────────────────────────────────────────────
export interface AutodnsOptions { user: string; password: string; context: string }
export class AutodnsProvider extends HttpProviderBase {
  readonly id = 'autodns'; readonly name = 'AutoDNS'
  private readonly user: string; private readonly password: string; private readonly context: string
  constructor(o: AutodnsOptions) {
    super('https://api.autodns.com/v1')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'autodns')
    this.user = o.user; this.password = o.password; this.context = o.context ?? '4'
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Domainrobot-Context': this.context, 'Authorization': `Basic ${btoa(`${this.user}:${this.password}`)}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zone/${domain}`, { origin: domain, resourceRecords: [{ name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 }] })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zone/${domain}/TXT`) } catch {}
  }
}

// ─── CloudX ─────────────────────────────────────────────────────
export interface CloudxOptions { apiKey: string }
export class CloudxProvider extends HttpProviderBase {
  readonly id = 'cx'; readonly name = 'CloudX'
  private readonly apiKey: string
  constructor(o: CloudxOptions) {
    super('https://api.cloudx.io/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'cx')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Cpanel ─────────────────────────────────────────────────────
export interface CpanelOptions { url: string; user: string; token: string }
export class CpanelProvider extends HttpProviderBase {
  readonly id = 'cpanel'; readonly name = 'cPanel'
  private readonly user: string; private readonly token: string
  constructor(o: CpanelOptions) {
    super(o.url || 'https://localhost:2083')
    if (!o.url || !o.user || !o.token) throw new DnsProviderError('url, user and token required', 'cpanel')
    this.user = o.user; this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `cpanel ${this.user}:${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    const params = new URLSearchParams({ cpanel_jsonapi_module: 'ZoneEdit', cpanel_jsonapi_func: 'add_zone_record', domain, name: sub, type: 'TXT', txtdata: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/execute/?${params}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const { domain } = s2(r.fulldomain)
      const params = new URLSearchParams({ cpanel_jsonapi_module: 'ZoneEdit', cpanel_jsonapi_func: 'remove_zone_record', domain, type: 'TXT', line: '1' })
      await fetch(`${this.baseUrl}/execute/?${params}`, { headers: this.buildAuthHeaders() })
    } catch {}
  }
}

// ─── DDNSS ──────────────────────────────────────────────────────
export interface DdnssOptions { user: string; password: string }
export class DdnssProvider extends HttpProviderBase {
  readonly id = 'ddnss'; readonly name = 'DDNSS'
  private readonly auth: string
  constructor(o: DdnssOptions) {
    super('https://api.ddnss.de')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'ddnss')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await fetch(`${this.baseUrl}/upd.php?user=&pw=&hostname=${r.fulldomain}&txt=${encodeURIComponent(r.txtvalue)}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try { await fetch(`${this.baseUrl}/upd.php?user=&pw=&hostname=${r.fulldomain}&txt=`, { headers: this.buildAuthHeaders() }) } catch {}
  }
}

// ─── DNSimple ───────────────────────────────────────────────────
export interface DnsimpleOptions { token: string }
export class DnsimpleProvider extends HttpProviderBase {
  readonly id = 'dnsimple'; readonly name = 'DNSimple'
  private readonly token: string
  constructor(o: DnsimpleOptions) {
    super('https://api.dnsimple.com/v2')
    if (!o.token) throw new DnsProviderError('token required', 'dnsimple')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    const accountId = await this.getAccountId()
    await this.request('POST', `${this.baseUrl}/${accountId}/zones/${domain}/records`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const { domain, sub } = s2(r.fulldomain)
      const accountId = await this.getAccountId()
      const { data } = await this.request<{ data: Array<{ id: number; content: string }> }>('GET', `${this.baseUrl}/${accountId}/zones/${domain}/records`)
      const m = data.data?.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${accountId}/zones/${domain}/records/${m.id}`)
    } catch {}
  }
  private async getAccountId(): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: number }> }>('GET', `${this.baseUrl}/accounts`)
    return String(data.data?.[0]?.id ?? '0')
  }
}

// ─── DNSPod (v2 - separate from dp) ────────────────────────────
export interface DnsmadeeasyOptions { apiKey: string; secretKey: string }
export class DnsmadeeasyProvider extends HttpProviderBase {
  readonly id = 'dnsmadeeasy'; readonly name = 'DNS Made Easy'
  private readonly apiKey: string; private readonly secretKey: string
  constructor(o: DnsmadeeasyOptions) {
    super('https://api.dnsmadeeasy.com/V2.0')
    if (!o.apiKey || !o.secretKey) throw new DnsProviderError('apiKey and secretKey required', 'dnsmadeeasy')
    this.apiKey = o.apiKey; this.secretKey = o.secretKey
  }
  protected buildAuthHeaders(): Record<string, string> {
    const ts = Date.now().toString()
    return { 'x-dnsme-apiKey': this.apiKey, 'x-dnsme-requestDate': ts }
  }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    const { domain } = s2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/dns/managed/${zoneId}/records`, { name, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<{ data: Array<{ id: number; value: string }> }>('GET', `${this.baseUrl}/dns/managed/${zoneId}/records`)
      const m = data.data?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns/managed/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: number; name: string }> }>('GET', `${this.baseUrl}/dns/managed`)
    const zones = data.data ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return String(m.id) }
    throw new DnsProviderError(`zone not found for ${d}`, 'dnsmadeeasy')
  }
}

// ─── Dominion ───────────────────────────────────────────────────
export interface DominionOptions { apiKey: string }
export class DominionProvider extends HttpProviderBase {
  readonly id = 'dominion'; readonly name = 'Dominio Directo'
  private readonly apiKey: string
  constructor(o: DominionOptions) {
    super('https://api.dominiodirecto.com/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'dominion')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Durabledns ─────────────────────────────────────────────────
export interface DurablednsOptions { apiKey: string }
export class DurablednsProvider extends HttpProviderBase {
  readonly id = 'durabledns'; readonly name = 'DurableDNS'
  private readonly apiKey: string
  constructor(o: DurablednsOptions) {
    super('https://durabledns.com/services/dns')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'durabledns')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Dynv6 ──────────────────────────────────────────────────────
export interface Dynv6Options { token: string }
export class Dynv6Provider extends HttpProviderBase {
  readonly id = 'dynv6'; readonly name = 'dynv6'
  private readonly token: string
  constructor(o: Dynv6Options) {
    super('https://dynv6.com/api')
    if (!o.token) throw new DnsProviderError('token required', 'dynv6')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/v2/zones/${zoneId}/records`, { type: 'TXT', name: r.fulldomain, data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<Array<{ id: string; data: string }>>('GET', `${this.baseUrl}/v2/zones/${zoneId}/records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/v2/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/v2/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'dynv6')
  }
}

// ─── EasyDNS ────────────────────────────────────────────────────
export interface EasydnsOptions { token: string; key: string }
export class EasydnsProvider extends HttpProviderBase {
  readonly id = 'easydns'; readonly name = 'easyDNS'
  private readonly auth: string
  constructor(o: EasydnsOptions) {
    super('https://rest.easydns.net')
    if (!o.token || !o.key) throw new DnsProviderError('token and key required', 'easydns')
    this.auth = `Basic ${btoa(`${o.token}:${o.key}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zones/records/all/${domain}`, { host: sub, type: 'TXT', rdata: r.txtvalue, ttl: 300, prio: 0 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/records/all/${domain}/TXT`) } catch {}
  }
}

// ─── Euserv ─────────────────────────────────────────────────────
export interface EuservOptions { email: string; password: string }
export class EuservProvider extends HttpProviderBase {
  readonly id = 'euserv'; readonly name = 'EUserv'
  private readonly auth: string
  constructor(o: EuservOptions) {
    super('https://api.euserv.net')
    if (!o.email || !o.password) throw new DnsProviderError('email and password required', 'euserv')
    this.auth = `Basic ${btoa(`${o.email}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Futurecms ──────────────────────────────────────────────────
export interface FuturecmsOptions { apiKey: string }
export class FuturecmsProvider extends HttpProviderBase {
  readonly id = 'futurecms'; readonly name = 'FutureCMS'
  private readonly apiKey: string
  constructor(o: FuturecmsOptions) {
    super('https://api.futurecms.io/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'futurecms')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Gcloud (Google Cloud DNS) ──────────────────────────────────
export interface GcloudOptions { projectId: string; serviceAccountKey: string }
export class GcloudProvider extends HttpProviderBase {
  readonly id = 'gcloud'; readonly name = 'Google Cloud DNS'
  private readonly projectId: string; private readonly saKey: string; private accessToken = ''
  constructor(o: GcloudOptions) {
    super('https://dns.googleapis.com/dns/v1')
    if (!o.projectId || !o.serviceAccountKey) throw new DnsProviderError('projectId and serviceAccountKey required', 'gcloud')
    this.projectId = o.projectId; this.saKey = o.serviceAccountKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.accessToken}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    const zoneId = await this.fz(domain)
    await this.request('POST', `${this.baseUrl}/projects/${this.projectId}/managedZones/${zoneId}/rrsets`, {
      kind: 'dns#resourceRecordSet', name: `${r.fulldomain}.`, type: 'TXT', ttl: 300, rrdatas: [`"${r.txtvalue}"`],
    })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const zoneId = await this.fz(domain)
      await this.request('DELETE', `${this.baseUrl}/projects/${this.projectId}/managedZones/${zoneId}/rrsets/${r.fulldomain}./TXT`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ managedZones: Array<{ id: string; dnsName: string }> }>('GET', `${this.baseUrl}/projects/${this.projectId}/managedZones`)
    const zones = data.managedZones ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.dnsName === `${c}.`); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'gcloud')
  }
}

// ─── Hurricane Electric (HE) ────────────────────────────────────
export interface HeOptions { user: string; password: string }
export class HeProvider extends HttpProviderBase {
  readonly id = 'he'; readonly name = 'Hurricane Electric'
  private readonly user: string; private readonly password: string
  constructor(o: HeOptions) {
    super('https://dns.he.net')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'he')
    this.user = o.user; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ email: this.user, pass: this.password, account: '', menu: 'edit_zone', Type: 'TXT', hosted_dns_zoneid: '', hosted_dns_recordname: r.fulldomain, hosted_dns_recordcontent: r.txtvalue, ttl: '300' })
    await fetch(this.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ email: this.user, pass: this.password, menu: 'delete_record', hosted_dns_zoneid: '', record_id: '' })
      await fetch(this.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
    } catch {}
  }
}

// ─── Joker ──────────────────────────────────────────────────────
export interface JokerOptions { apiKey: string }
export class JokerProvider extends HttpProviderBase {
  readonly id = 'joker'; readonly name = 'Joker.com'
  private readonly apiKey: string
  constructor(o: JokerOptions) {
    super('https://dmapi.joker.com/request')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'joker')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Auth-Api-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await fetch(`${this.baseUrl}/dns-zone-get?domain=${domain}`, { headers: this.buildAuthHeaders() })
    await fetch(`${this.baseUrl}/dns-zone-put?domain=${domain}&zone=${sub} TXT 0 ${r.txtvalue} 300`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const { domain } = s2(r.fulldomain)
      await fetch(`${this.baseUrl}/dns-zone-put?domain=${domain}&zone=`, { headers: this.buildAuthHeaders() })
    } catch {}
  }
}

// ─── Kinghost ───────────────────────────────────────────────────
export interface KinghostOptions { apiKey: string }
export class KinghostProvider extends HttpProviderBase {
  readonly id = 'kinghost'; readonly name = 'KingHost'
  private readonly apiKey: string
  constructor(o: KinghostOptions) {
    super('https://api.kinghost.net')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'kinghost')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Knot ───────────────────────────────────────────────────────
export interface KnotOptions { url: string; token: string }
export class KnotProvider extends HttpProviderBase {
  readonly id = 'knot'; readonly name = 'Knot DNS'
  private readonly token: string
  constructor(o: KnotOptions) {
    super(o.url || 'http://localhost:8080')
    if (!o.url || !o.token) throw new DnsProviderError('url and token required', 'knot')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`, { rrdata: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`) } catch {}
  }
}

// ─── Luadns ─────────────────────────────────────────────────────
export interface LuadnsOptions { email: string; apiKey: string }
export class LuadnsProvider extends HttpProviderBase {
  readonly id = 'luadns'; readonly name = 'LuaDNS'
  private readonly auth: string
  constructor(o: LuadnsOptions) {
    super('https://api.luadns.com/v1')
    if (!o.email || !o.apiKey) throw new DnsProviderError('email and apiKey required', 'luadns')
    this.auth = `Basic ${btoa(`${o.email}:${o.apiKey}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${zoneId}/records`, { name: `${r.fulldomain}.`, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<Array<{ id: number; content: string }>>('GET', `${this.baseUrl}/zones/${zoneId}/records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: number; name: string }>>('GET', `${this.baseUrl}/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === `${c}.` || z.name === c); if (m) return String(m.id) }
    throw new DnsProviderError(`zone not found for ${d}`, 'luadns')
  }
}

// ─── Mythic Beasts ──────────────────────────────────────────────
export interface MythicOptions { user: string; password: string }
export class MythicProvider extends HttpProviderBase {
  readonly id = 'mythic'; readonly name = 'Mythic Beasts'
  private readonly auth: string
  constructor(o: MythicOptions) {
    super('https://api.mythic-beasts.com/dns/v2')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'mythic')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`, { records: [{ host: sub, ttl: 300, type: 'TXT', data: r.txtvalue }] })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`) } catch {}
  }
}

// ─── Name.com ───────────────────────────────────────────────────
export interface NamecomOptions { user: string; token: string }
export class NamecomProvider extends HttpProviderBase {
  readonly id = 'namecom'; readonly name = 'Name.com'
  private readonly auth: string
  constructor(o: NamecomOptions) {
    super('https://api.name.com/v4')
    if (!o.user || !o.token) throw new DnsProviderError('user and token required', 'namecom')
    this.auth = `Basic ${btoa(`${o.user}:${o.token}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { host: sub, type: 'TXT', answer: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: number; answer: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.records?.find((x: { answer: string }) => x.answer === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}

// ─── Natro ──────────────────────────────────────────────────────
export interface NatroOptions { apiKey: string; apiSecret: string }
export class NatroProvider extends HttpProviderBase {
  readonly id = 'natro'; readonly name = 'Natro DNS'
  private readonly apiKey: string; private readonly apiSecret: string
  constructor(o: NatroOptions) {
    super('https://api.natro.com/v1')
    if (!o.apiKey || !o.apiSecret) throw new DnsProviderError('apiKey and apiSecret required', 'natro')
    this.apiKey = o.apiKey; this.apiSecret = o.apiSecret
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `${this.apiKey}:${this.apiSecret}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Netcup ─────────────────────────────────────────────────────
export interface NetcupOptions { apiKey: string; apiPassword: string; customerId: string }
export class NetcupProvider extends HttpProviderBase {
  readonly id = 'netcup'; readonly name = 'Netcup'
  private readonly apiKey: string; private readonly apiPassword: string; private readonly customerId: string; private sessionId = ''
  constructor(o: NetcupOptions) {
    super('https://ccp.netcup.net/run/webservice/servers/endpoint.php?JSON')
    if (!o.apiKey || !o.apiPassword || !o.customerId) throw new DnsProviderError('apiKey, apiPassword and customerId required', 'netcup')
    this.apiKey = o.apiKey; this.apiPassword = o.apiPassword; this.customerId = o.customerId
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private async ncCall(action: string, params: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.request<{ responsedata: Record<string, unknown> }>('POST', this.baseUrl, { action, param: { ...params, apikey: this.apiKey, apisessionid: this.sessionId } })
    return data.responsedata
  }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    if (!this.sessionId) {
      const result = await this.ncCall('login', { customernumber: this.customerId, apipassword: this.apiPassword }) as Record<string, string>
      this.sessionId = result.apisessionid ?? ''
    }
    const { domain, sub } = s2(r.fulldomain)
    await this.ncCall('updateDnsRecords', { domainname: domain, dnsrecordset: { dns_records: [{ hostname: sub, type: 'TXT', destination: r.txtvalue, ttl: 300 }] } })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const { domain, sub } = s2(r.fulldomain)
      await this.ncCall('updateDnsRecords', { domainname: domain, dnsrecordset: { dns_records: [{ hostname: sub, type: 'TXT', destination: r.txtvalue, delete: true }] } })
    } catch {}
  }
}

// ─── NS1 ────────────────────────────────────────────────────────
export interface NsoneOptions { apiKey: string }
export class NsoneProvider extends HttpProviderBase {
  readonly id = 'nsone'; readonly name = 'NS1'
  private readonly apiKey: string
  constructor(o: NsoneOptions) {
    super('https://api.nsone.net/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'nsone')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-NSONE-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`, { zone: domain, domain: r.fulldomain, type: 'TXT', ttl: 300, answers: [{ rdata: [r.txtvalue] }] })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`) } catch {}
  }
}

// ─── One.com ────────────────────────────────────────────────────
export interface OnecomOptions { token: string }
export class OnecomProvider extends HttpProviderBase {
  readonly id = 'one'; readonly name = 'One.com'
  private readonly token: string
  constructor(o: OnecomOptions) {
    super('https://www.one.com/admin/api')
    if (!o.token) throw new DnsProviderError('token required', 'one')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/dns/custom_records`, { type: 'TXT', prefix: sub, priority: 0, ttl: 3600, data: r.txtvalue })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const { data } = await this.request<{ result: { records: Array<{ id: string; data: string }> } }>('GET', `${this.baseUrl}/domains/${domain}/dns/custom_records`)
      const records = data.result?.records ?? []
      const m = records.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/dns/custom_records/${m.id}`)
    } catch {}
  }
}

// ─── Pantheon ───────────────────────────────────────────────────
export interface PantheonOptions { token: string }
export class PantheonProvider extends HttpProviderBase {
  readonly id = 'pantheon'; readonly name = 'Pantheon'
  private readonly token: string
  constructor(o: PantheonOptions) {
    super('https://api.pantheon.io/v1')
    if (!o.token) throw new DnsProviderError('token required', 'pantheon')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── PowerDNS ───────────────────────────────────────────────────
export interface PowerdnsOptions { url: string; apiKey: string; serverId?: string }
export class PowerdnsProvider extends HttpProviderBase {
  readonly id = 'pdns'; readonly name = 'PowerDNS'
  private readonly apiKey: string; private readonly serverId: string
  constructor(o: PowerdnsOptions) {
    super(o.url || 'http://localhost:8081')
    if (!o.url || !o.apiKey) throw new DnsProviderError('url and apiKey required', 'pdns')
    this.apiKey = o.apiKey; this.serverId = o.serverId ?? 'localhost'
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    const zoneId = await this.fz(domain)
    await this.request('PATCH', `${this.baseUrl}/api/v1/servers/${this.serverId}/zones/${zoneId}`, {
      rrsets: [{ name: `${r.fulldomain}.`, type: 'TXT', changetype: 'REPLACE', ttl: 300, records: [{ content: `"${r.txtvalue}"`, disabled: false }] }],
    })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const zoneId = await this.fz(domain)
      await this.request('PATCH', `${this.baseUrl}/api/v1/servers/${this.serverId}/zones/${zoneId}`, {
        rrsets: [{ name: `${r.fulldomain}.`, type: 'TXT', changetype: 'DELETE' }],
      })
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/api/v1/servers/${this.serverId}/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === `${c}.` || z.name === c); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'pdns')
  }
}

// ─── Qiniu ──────────────────────────────────────────────────────
export interface QiniuOptions { accessKey: string; secretKey: string }
export class QiniuProvider extends HttpProviderBase {
  readonly id = 'qiniu'; readonly name = 'Qiniu DNS'
  private readonly accessKey: string; private readonly secretKey: string
  constructor(o: QiniuOptions) {
    super('https://api.qiniu.com')
    if (!o.accessKey || !o.secretKey) throw new DnsProviderError('accessKey and secretKey required', 'qiniu')
    this.accessKey = o.accessKey; this.secretKey = o.secretKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `UpToken ${this.accessKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Rage4 ──────────────────────────────────────────────────────
export interface Rage4Options { email: string; token: string }
export class Rage4Provider extends HttpProviderBase {
  readonly id = 'rage4'; readonly name = 'Rage4'
  private readonly auth: string
  constructor(o: Rage4Options) {
    super('https://rage4.com/rapi')
    if (!o.email || !o.token) throw new DnsProviderError('email and token required', 'rage4')
    this.auth = `Basic ${btoa(`${o.email}:${o.token}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('GET', `${this.baseUrl}/createrecord/?id=${zoneId}&name=${r.fulldomain}&type=TXT&content=${encodeURIComponent(r.txtvalue)}&ttl=300`)
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<Array<{ id: number; content: string }>>('GET', `${this.baseUrl}/showrecords/?id=${zoneId}`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('GET', `${this.baseUrl}/deleterecord/?id=${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: number; name: string }>>('GET', `${this.baseUrl}/showzones/`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return String(m.id) }
    throw new DnsProviderError(`zone not found for ${d}`, 'rage4')
  }
}

// ─── Selfhost ───────────────────────────────────────────────────
export interface SelfhostOptions { user: string; password: string }
export class SelfhostProvider extends HttpProviderBase {
  readonly id = 'selfhost'; readonly name = 'SelfHost.de'
  private readonly auth: string
  constructor(o: SelfhostOptions) {
    super('https://selfhost.de/cgi-bin/api.cgi')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'selfhost')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await fetch(`${this.baseUrl}?cmd=CreateRecord&rr=${r.fulldomain}&type=TXT&data=${encodeURIComponent(r.txtvalue)}&ttl=300`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try { await fetch(`${this.baseUrl}?cmd=DeleteRecord&rr=${r.fulldomain}&type=TXT`, { headers: this.buildAuthHeaders() }) } catch {}
  }
}

// ─── Servercow ──────────────────────────────────────────────────
export interface ServercowOptions { username: string; password: string }
export class ServercowProvider extends HttpProviderBase {
  readonly id = 'servercow'; readonly name = 'Servercow'
  private readonly auth: string
  constructor(o: ServercowOptions) {
    super('https://api.servercow.de/dns/v1')
    if (!o.username || !o.password) throw new DnsProviderError('username and password required', 'servercow')
    this.auth = `Basic ${btoa(`${o.username}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Sedo ───────────────────────────────────────────────────────
export interface SedoOptions { apiKey: string }
export class SedoProvider extends HttpProviderBase {
  readonly id = 'sedo'; readonly name = 'Sedo'
  private readonly apiKey: string
  constructor(o: SedoOptions) {
    super('https://api.sedo.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'sedo')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── All-Inkl ───────────────────────────────────────────────────
export interface AllinklOptions { user: string; password: string }
export class AllinklProvider extends HttpProviderBase {
  readonly id = 'allinkl'; readonly name = 'All-Inkl'
  private readonly auth: string
  constructor(o: AllinklOptions) {
    super('https://kasapi.kasserver.com/dokumentation')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'allinkl')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Conoha ─────────────────────────────────────────────────────
export interface ConohaOptions { token: string; region: string }
export class ConohaProvider extends HttpProviderBase {
  readonly id = 'conoha'; readonly name = 'ConoHa'
  private readonly token: string
  constructor(o: ConohaOptions) {
    super(`https://dns-service.${o.region || 'tyo1'}.conoha.io/v1`)
    if (!o.token) throw new DnsProviderError('token required', 'conoha')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.token } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/records`, { name: `${r.fulldomain}.`, type: 'TXT', data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<{ records: Array<{ id: string; data: string }> }>('GET', `${this.baseUrl}/domains/${zoneId}/records`)
      const m = data.records?.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ domains: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/domains`)
    const zones = data.domains ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === `${c}.`); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'conoha')
  }
}

// ─── Centarra ───────────────────────────────────────────────────
export interface CentarraOptions { apiKey: string }
export class CentarraProvider extends HttpProviderBase {
  readonly id = 'centarra'; readonly name = 'Centarra'
  private readonly apiKey: string
  constructor(o: CentarraOptions) {
    super('https://api.centarra.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'centarra')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Kapper ─────────────────────────────────────────────────────
export interface KapperOptions { apiKey: string; secret: string }
export class KapperProvider extends HttpProviderBase {
  readonly id = 'kapper'; readonly name = 'Kapper DNS'
  private readonly auth: string
  constructor(o: KapperOptions) {
    super('https://dnspanel.kapper.net/api/1.2')
    if (!o.apiKey || !o.secret) throw new DnsProviderError('apiKey and secret required', 'kapper')
    this.auth = `Basic ${btoa(`${o.apiKey}:${o.secret}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/record`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/record/${sub}/TXT`) } catch {}
  }
}

// ─── Nederhost ──────────────────────────────────────────────────
export interface NederhostOptions { token: string }
export class NederhostProvider extends HttpProviderBase {
  readonly id = 'nederhost'; readonly name = 'Nederhost'
  private readonly token: string
  constructor(o: NederhostOptions) {
    super('https://api.nederhost.nl/dns/v1')
    if (!o.token) throw new DnsProviderError('token required', 'nederhost')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('PATCH', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`, { type: 'TXT', name: sub, values: [r.txtvalue], ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`) } catch {}
  }
}

// ─── ISPConfig ──────────────────────────────────────────────────
export interface IspconfigOptions { url: string; user: string; password: string }
export class IspconfigProvider extends HttpProviderBase {
  readonly id = 'ispconfig'; readonly name = 'ISPConfig'
  private readonly user: string; private readonly password: string; private sessionId = ''
  constructor(o: IspconfigOptions) {
    super(o.url || 'https://localhost:8080/remote/json.php')
    if (!o.url || !o.user || !o.password) throw new DnsProviderError('url, user and password required', 'ispconfig')
    this.user = o.user; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private async icCall(fn: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.sessionId) {
      const { data } = await this.request<{ response: string }>('POST', this.baseUrl, { session_login: this.user, session_password: this.password })
      this.sessionId = data.response
    }
    const { data } = await this.request<{ response: unknown }>('POST', this.baseUrl, { session_id: this.sessionId, ...params, fn })
    return data.response
  }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.icCall('dns_txt_add', { zone_id: domain, params: { name: sub, type: 'txt', data: r.txtvalue, ttl: 300, active: 'y' } })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try { await this.icCall('dns_txt_delete', { primary_id: r.fulldomain }) } catch {}
  }
}
